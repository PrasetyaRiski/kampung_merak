"""MJPEG Gateway OpenCV untuk Kampung Merak.

Fitur:
- Deteksi cepat (TCP ping socket) sebelum koneksi OpenCV agar server tidak freeze/layar hitam saat kamera offline.
- Dukungan Dual-Mode: Deteksi langsung ke RTSP kamera, dengan fallback otomatis ke Tailscale Relay laptop (100.98.167.15) jika server berada di jaringan berbeda.
- Tampilan diagnostic standby frame otomatis saat kamera offline/gagal menyambung.
- Masking password kredensial di layar untuk keamanan.
- Resize proporsional untuk menghemat CPU server.
- OpenCV contour detection overlay.
"""

from __future__ import annotations

import os
import re
import socket
import time
import urllib.parse
import urllib.request
from typing import Generator

import cv2
import numpy as np
from flask import Flask, Response, request
from dotenv import load_dotenv

# Optimasi FFMPEG agar stream tidak delay (nobuffer & low_delay) dan timeout 5 detik
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|stimeout;5000000"

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

INCUBATOR_RTSP_URL = os.environ.get(
    "INCUBATOR_RTSP_URL",
    "rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000",
)
KANDANG_RTSP_URL = os.environ.get(
    "KANDANG_RTSP_URL",
    "rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000",
)
FALLBACK_RELAY_URL = os.environ.get(
    "FALLBACK_RELAY_URL",
    "http://100.98.167.15:5000/video_feed",
)


def mask_rtsp_url(url: str) -> str:
    """Sembunyikan password dalam URL RTSP agar tidak bocor di tampilan."""
    return re.sub(r":([^@/]+)@", ":****@", url)


def parse_host_port(url: str) -> tuple[str, int]:
    """Ekstrak host dan port dari URL RTSP atau HTTP."""
    try:
        parsed = urllib.parse.urlsplit(url)
        host = parsed.hostname or ""
        port = parsed.port or (443 if parsed.scheme == "https" else 80 if parsed.scheme == "http" else 554)
        return host, port
    except Exception:
        return "", 554


def is_camera_reachable(host: str, port: int, timeout: float = 1.2) -> bool:
    """Cek cepat apakah port RTSP kamera terbuka dan dapat dijangkau dari server."""
    if not host:
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            res = s.connect_ex((host, port))
            return res == 0
    except Exception:
        return False


def is_relay_reachable(relay_url: str, timeout: float = 1.0) -> bool:
    """Cek apakah endpoint relay Tailscale dari laptop online."""
    host, port = parse_host_port(relay_url)
    return is_camera_reachable(host, port, timeout=timeout)


def create_standby_frame(title: str, target_url: str, reason: str = "") -> bytes | None:
    """Membuat frame diagnostik informatif saat kamera offline agar web tidak blank hitam."""
    frame = np.zeros((360, 640, 3), dtype=np.uint8)
    frame[:] = (24, 28, 32)  # Background slate dark

    # Lingkaran icon peringatan
    cv2.circle(frame, (320, 85), 26, (45, 52, 185), -1)
    cv2.circle(frame, (320, 85), 32, (75, 85, 235), 2)
    cv2.putText(frame, "!", (314, 96), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 3, cv2.LINE_AA)

    # Judul Status
    cv2.putText(frame, title, (40, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (240, 240, 240), 2, cv2.LINE_AA)

    # URL RTSP (Password di-mask)
    masked = mask_rtsp_url(target_url)
    disp_sub = f"Target: {masked}"
    if len(disp_sub) > 65:
        disp_sub = disp_sub[:62] + "..."
    cv2.putText(frame, disp_sub, (40, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1, cv2.LINE_AA)

    # Alasan / Instruksi
    hint = reason if reason else "Periksa apakah kamera CCTV menyala dan alamat IP sudah sesuai jaringan."
    if len(hint) > 70:
        hint = hint[:67] + "..."
    cv2.putText(frame, hint, (40, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (130, 130, 130), 1, cv2.LINE_AA)

    # Waktu server real-time (membuktikan koneksi gateway aktif dan berjalan)
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(
        frame,
        f"Mencoba menyambung ulang... ({now_str})",
        (40, 305),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (70, 210, 150),
        1,
        cv2.LINE_AA,
    )

    ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    if ok:
        return (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
        )
    return None


def draw_opencv_overlay(frame, label: str):
    """Tambahkan overlay kontur sederhana tanpa model YOLO."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 45, 135)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours[:30]:
        area = cv2.contourArea(contour)
        if area < 1200:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (108, 250, 215), 2)

    cv2.putText(
        frame,
        f"{label} | OpenCV aktif",
        (16, 34),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (108, 250, 215),
        2,
        cv2.LINE_AA,
    )
    return frame


def generate_frames(rtsp_url: str, label: str) -> Generator[bytes, None, None]:
    masked_url = mask_rtsp_url(rtsp_url)
    print(f"[CCTV] Permintaan stream ({label}) ke: {masked_url}")

    host, port = parse_host_port(rtsp_url)

    # 1. Kirim frame standby awal seketika agar browser tidak blank hitam
    first_frame = create_standby_frame(f"Memeriksa Kamera ({label})...", rtsp_url, "Menghubungkan ke gateway...")
    if first_frame:
        yield first_frame

    camera = None
    last_log_state = None

    try:
        while True:
            # 2. Cek apakah RTSP kamera dapat dijangkau secara langsung
            direct_ok = is_camera_reachable(host, port, timeout=1.0)

            if not direct_ok:
                # Cek fallback ke relay Tailscale dari laptop
                if FALLBACK_RELAY_URL and is_relay_reachable(FALLBACK_RELAY_URL, timeout=1.0):
                    if last_log_state != "relay":
                        print(f"[CCTV] RTSP langsung {host}:{port} tidak dapat dijangkau. Menggunakan Tailscale Relay: {FALLBACK_RELAY_URL}")
                        last_log_state = "relay"
                    try:
                        req = urllib.request.Request(FALLBACK_RELAY_URL, headers={"User-Agent": "CCTV-Relay/1.0"})
                        with urllib.request.urlopen(req, timeout=10) as stream:
                            while True:
                                chunk = stream.read(16384)
                                if not chunk:
                                    break
                                yield chunk
                    except Exception as e:
                        print(f"[CCTV] Tailscale Relay terputus: {e}")
                        time.sleep(1.5)
                        continue

                # Jika baik kamera langsung maupun relay tidak aktif
                if last_log_state != "unreachable":
                    print(f"[CCTV] Host {host}:{port} & Relay tidak dapat dijangkau dari server ini.")
                    last_log_state = "unreachable"

                standby = create_standby_frame(
                    f"Kamera ({label}) Offline / Tak Terjangkau",
                    rtsp_url,
                    f"Host {host}:{port} tidak dapat dijangkau dari server.",
                )
                if standby:
                    yield standby
                time.sleep(2.0)
                continue

            # 3. Jika RTSP langsung terjangkau, buka koneksi OpenCV VideoCapture jika belum ada
            if camera is None or not camera.isOpened():
                if last_log_state != "connecting":
                    print(f"[CCTV] Menyambung OpenCV langsung ke RTSP {masked_url}...")
                    last_log_state = "connecting"

                camera = cv2.VideoCapture(rtsp_url)
                camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)

                if not camera.isOpened():
                    standby = create_standby_frame(
                        f"Gagal Inisialisasi RTSP ({label})",
                        rtsp_url,
                        "Kamera menolak koneksi RTSP (periksa username & password).",
                    )
                    if standby:
                        yield standby
                    time.sleep(2.0)
                    continue

            # 4. Baca frame dari stream OpenCV langsung
            success, frame = camera.read()
            if not success:
                if last_log_state != "read_failed":
                    print(f"[CCTV] Gagal membaca frame dari RTSP ({label}). Menyambung ulang...")
                    last_log_state = "read_failed"

                standby = create_standby_frame(
                    f"Kamera ({label}) Terputus",
                    rtsp_url,
                    "Aliran frame terhenti sementara. Menyambung ulang...",
                )
                if standby:
                    yield standby

                camera.release()
                camera = None
                time.sleep(1.5)
                continue

            if last_log_state != "streaming":
                print(f"[CCTV] SUKSES: Menerima video langsung dari kamera ({label})!")
                last_log_state = "streaming"

            # Resize proporsional agar hemat CPU server
            h, w = frame.shape[:2]
            if w > 1280 or h > 720:
                scale = min(1280 / w, 720 / h)
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

            frame = draw_opencv_overlay(frame, label)

            ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
            if not ok:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )

    except GeneratorExit:
        print(f"[CCTV] Klien web terputus dari stream {label}.")
    finally:
        print(f"[CCTV] Membersihkan koneksi kamera {label}...")
        if camera is not None:
            camera.release()


@app.get("/video_feed")
def video_feed() -> Response:
    custom_url = request.args.get("url")
    target_url = custom_url if custom_url else INCUBATOR_RTSP_URL

    return Response(
        generate_frames(target_url, "Inkubator"),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/kandang_feed")
def kandang_feed() -> Response:
    return Response(
        generate_frames(KANDANG_RTSP_URL, "Kandang Merak"),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/health")
@app.get("/cctv_health")
def health() -> dict:
    inc_host, inc_port = parse_host_port(INCUBATOR_RTSP_URL)
    direct_reachable = is_camera_reachable(inc_host, inc_port, timeout=0.8)
    relay_reachable = is_relay_reachable(FALLBACK_RELAY_URL, timeout=0.8) if not direct_reachable else False

    reachable = direct_reachable or relay_reachable
    source = "direct_rtsp" if direct_reachable else ("tailscale_laptop_relay" if relay_reachable else "none")

    return {
        "status": "ok",
        "service": "kampung-merak-opencv-gateway",
        "incubator_reachable": reachable,
        "stream_source": source,
        "incubator_target": mask_rtsp_url(INCUBATOR_RTSP_URL),
        "relay_target": FALLBACK_RELAY_URL if relay_reachable else None,
        "incubator_endpoint": "/video_feed",
        "kandang_endpoint": "/kandang_feed",
    }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)
