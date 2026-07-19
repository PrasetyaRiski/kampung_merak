"""Contoh MJPEG Gateway OpenCV untuk Kampung Merak.

Jalankan:
    pip install -r requirements.txt
    python rtsp_gateway_example.py

Atur URL kamera melalui environment variable:
    INCUBATOR_RTSP_URL=rtsp://user:pass@192.168.1.20:554/stream1
    KANDANG_RTSP_URL=rtsp://user:pass@192.168.1.21:554/stream1

Endpoint:
    http://localhost:5000/video_feed
    http://localhost:5000/kandang_feed
"""

from __future__ import annotations

import os
import time
from typing import Generator

import cv2
from flask import Flask, Response, request
from dotenv import load_dotenv

# Optimasi FFMPEG agar stream tidak delay (nobuffer & low_delay)
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

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
    print(f"[CCTV] Menghubungkan ke kamera RTSP ({label}) di: {rtsp_url}")
    camera = cv2.VideoCapture(rtsp_url)
    camera.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Minta OpenCV tidak menumpuk antrean gambar
    
    last_status = None # None: awal, False: error terlog, True: sukses terlog

    try:
        while True:
            if not camera.isOpened():
                if last_status != False:
                    print(f"[CCTV] ERROR: Gagal membuka koneksi RTSP ({label}). Kamera offline atau salah URL. Mencoba menghubungkan kembali...")
                    last_status = False
                camera.release()
                time.sleep(2)
                camera = cv2.VideoCapture(rtsp_url)
                camera.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Set buffer ke minimum agar selalu real-time
                continue

            success, frame = camera.read()
            if not success:
                print(f"[CCTV] WARNING: Gagal membaca frame dari RTSP ({label}). Menyambung ulang...")
                camera.release()
                time.sleep(1)
                camera = cv2.VideoCapture(rtsp_url)
                camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                last_status = False
                continue
                
            if last_status != True:
                print(f"[CCTV] SUKSES: Berhasil terhubung dan menerima gambar dari kamera ({label})!")
                last_status = True

            # Resize ukuran gambar ke 720p (1280x720). 
            # Resolusi asli kamera Bardi (1296x2304) terlalu berat untuk diproses secara real-time dan memicu delay panjang.
            frame = cv2.resize(frame, (1296, 2304))

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
        if 'camera' in locals() and camera is not None:
            camera.release()


@app.get("/video_feed")
def video_feed() -> Response:
    # Mengambil URL dari parameter request jika tersedia, jika tidak pakai fallback default
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
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "kampung-merak-opencv-gateway",
        "incubator_endpoint": "/video_feed",
        "kandang_endpoint": "/kandang_feed",
    }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)
