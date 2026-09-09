"""TCP Relay Server untuk RTSP Bridge ESP32 -> Server -> OpenCV.

Mendukung port 554 (standar RTSP kamera), 8554 (port sekunder),
dan HTTP status di port 9001 untuk health check tanpa mengganggu stream RTSP.
"""

import socket
import threading
import time
import datetime
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

ESP_PORT = 9000
RTSP_PORTS = [554, 8554]
STATUS_PORT = 9001

esp_conn = None
esp_lock = threading.Lock()
esp_event = threading.Event()
active_client_count = 0

def log(msg: str):
    now = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {msg}", flush=True)

class StatusHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/status', '/health', '/cctv_health'):
            with esp_lock:
                is_connected = esp_conn is not None
            payload = json.dumps({
                "status": "ok" if is_connected else "offline",
                "esp_connected": is_connected,
                "active_clients": active_client_count,
            }).encode('utf-8')
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

def serve_status():
    try:
        httpd = HTTPServer(('0.0.0.0', STATUS_PORT), StatusHandler)
        log(f"[*] Status HTTP server listening di port 0.0.0.0:{STATUS_PORT}...")
        httpd.serve_forever()
    except Exception as e:
        log(f"[!] Gagal start Status HTTP server: {e}")

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
                        esp_conn.shutdown(socket.SHUT_RDWR)
                    except Exception:
                        pass
                    try:
                        esp_conn.close()
                    except Exception:
                        pass
                esp_conn = conn
                esp_event.set()
            log(f"[+] ESP32 TERHUBUNG dari {addr[0]}:{addr[1]}")
        except Exception as e:
            log(f"[!] Error saat accept ESP32: {e}")
            time.sleep(1)

def pipe(src: socket.socket, dst: socket.socket, label: str, byte_counter: list, on_close=None):
    total_bytes = 0
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
            total_bytes += len(data)
            byte_counter[0] = total_bytes
    except Exception:
        pass
    finally:
        log(f"[-] Selesai stream {label} (Total: {total_bytes / 1024:.1f} KB)")
        if on_close:
            on_close()

def serve_rtsp_port(port: int):
    global esp_conn, active_client_count
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server_sock.bind(('0.0.0.0', port))
    except Exception as e:
        log(f"[!] Gagal bind port {port}: {e}")
        return
    server_sock.listen(5)
    log(f"[*] Menunggu koneksi OpenCV di port 0.0.0.0:{port}...")

    while True:
        try:
            cv_conn, addr = server_sock.accept()
            cv_conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            log(f"[+] OpenCV terhubung dari {addr[0]}:{addr[1]} ke port {port}")

            if not esp_conn:
                log("[*] Menunggu ESP32 menyambung...")
                esp_event.wait(timeout=6.0)

            with esp_lock:
                active_esp = esp_conn

            if not active_esp:
                log("[!] ESP32 belum terhubung! Menutup koneksi OpenCV...")
                try:
                    cv_conn.close()
                except Exception:
                    pass
                continue

            active_client_count += 1
            session_closed = threading.Event()
            cv_bytes = [0]
            esp_bytes = [0]

            def close_session():
                global esp_conn, active_client_count
                if not session_closed.is_set():
                    session_closed.set()
                    active_client_count = max(0, active_client_count - 1)
                    try:
                        cv_conn.close()
                    except Exception:
                        pass
                    
                    if cv_bytes[0] > 0 or esp_bytes[0] > 0:
                        log(f"[*] Mereset sesi RTSP (Data: CV={cv_bytes[0]}B, ESP={esp_bytes[0]}B)...")
                        with esp_lock:
                            if esp_conn == active_esp:
                                try:
                                    active_esp.shutdown(socket.SHUT_RDWR)
                                except Exception:
                                    pass
                                try:
                                    active_esp.close()
                                except Exception:
                                    pass
                                esp_conn = None
                                esp_event.clear()
                    else:
                        log("[*] TCP Ping / port check terdeteksi (0 bytes). ESP32 tetap dipertahankan!")

            t1 = threading.Thread(
                target=pipe,
                args=(cv_conn, active_esp, f"OpenCV -> ESP32 ({port})", cv_bytes, close_session),
                daemon=True
            )
            t2 = threading.Thread(
                target=pipe,
                args=(active_esp, cv_conn, f"ESP32 -> OpenCV ({port})", esp_bytes, close_session),
                daemon=True
            )
            t1.start()
            t2.start()

        except Exception as e:
            log(f"[!] Error saat accept OpenCV pada port {port}: {e}")
            time.sleep(1)

def main():
    log("=== MEMULAI RTSP RELAY SERVER ===")
    t_esp = threading.Thread(target=handle_esp, daemon=True)
    t_esp.start()

    t_status = threading.Thread(target=serve_status, daemon=True)
    t_status.start()

    threads = []
    for p in RTSP_PORTS:
        t = threading.Thread(target=serve_rtsp_port, args=(p,), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

if __name__ == '__main__':
    main()