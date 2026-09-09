"""TCP Relay Server untuk RTSP Bridge ESP32 -> Server -> OpenCV.

Arsitektur:
1. ESP32 (di kandang) connect ke server:9000 (ESP_PORT).
2. OpenCV (di server / container) connect ke port 8554 (LOCAL_RTSP_PORT).
3. Relay server meneruskan paket TCP RTSP dua arah secara transparan.
"""

import socket
import threading
import time
import datetime

ESP_PORT = 9000           # Port listener publik untuk ESP32
LOCAL_RTSP_PORT = 8554     # Port listener lokal untuk OpenCV / container

esp_conn = None
esp_lock = threading.Lock()

def log(msg: str):
    now = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {msg}", flush=True)

def handle_esp():
    global esp_conn
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind(('0.0.0.0', ESP_PORT))
    server_sock.listen(5)
    log(f"[*] Menunggu koneksi ESP32 di port 0.0.0.0:{ESP_PORT}...")

    while True:
        try:
            conn, addr = server_sock.accept()
            conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            with esp_lock:
                if esp_conn:
                    try:
                        esp_conn.close()
                    except Exception:
                        pass
                esp_conn = conn
            log(f"[+] ESP32 TERHUBUNG dari {addr[0]}:{addr[1]}")
        except Exception as e:
            log(f"[!] Error saat accept ESP32: {e}")
            time.sleep(1)

def pipe(src: socket.socket, dst: socket.socket, label: str):
    total_bytes = 0
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
            total_bytes += len(data)
    except Exception:
        pass
    finally:
        log(f"[-] Selesai stream {label} (Total dialirkan: {total_bytes / 1024:.1f} KB)")
        try:
            src.close()
        except Exception:
            pass

def handle_opencv():
    global esp_conn
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    # Bind 0.0.0.0 agar container Docker (merak_cctv) dapat mengakses via IP gateway host
    server_sock.bind(('0.0.0.0', LOCAL_RTSP_PORT))
    server_sock.listen(5)
    log(f"[*] Menunggu koneksi OpenCV di port 0.0.0.0:{LOCAL_RTSP_PORT}...")

    while True:
        try:
            cv_conn, addr = server_sock.accept()
            cv_conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            log(f"[+] OpenCV terhubung dari {addr[0]}:{addr[1]}")

            with esp_lock:
                active_esp = esp_conn

            if not active_esp:
                log("[!] ESP32 belum terhubung! Menutup koneksi OpenCV sementara...")
                try:
                    cv_conn.close()
                except Exception:
                    pass
                continue

            # Jalankan thread duplex bridging
            t1 = threading.Thread(target=pipe, args=(cv_conn, active_esp, "OpenCV -> ESP32"), daemon=True)
            t2 = threading.Thread(target=pipe, args=(active_esp, cv_conn, "ESP32 -> OpenCV"), daemon=True)
            t1.start()
            t2.start()
        except Exception as e:
            log(f"[!] Error saat accept OpenCV: {e}")
            time.sleep(1)

if __name__ == '__main__':
    log("=== MEMULAI RTSP RELAY SERVER ===")
    t_esp = threading.Thread(target=handle_esp, daemon=True)
    t_esp.start()
    handle_opencv()