"""TCP Relay Server untuk RTSP Bridge ESP32 -> Server -> OpenCV.

Mendukung port 554 (standar RTSP kamera) dan port 8554 (port sekunder).
"""

import socket
import threading
import time
import datetime

ESP_PORT = 9000
RTSP_PORTS = [554, 8554]

esp_conn = None
esp_lock = threading.Lock()
esp_event = threading.Event()

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
    global esp_conn
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

            # Tunggu koneksi ESP32 jika belum siap (maks 6 detik)
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

            session_closed = threading.Event()
            cv_bytes = [0]
            esp_bytes = [0]

            def close_session():
                global esp_conn
                if not session_closed.is_set():
                    session_closed.set()
                    try:
                        cv_conn.close()
                    except Exception:
                        pass
                    
                    # Jangan putus ESP32 jika ini hanya TCP ping (is_port_open) tanpa payload RTSP!
                    if cv_bytes[0] > 0 or esp_bytes[0] > 500:
                        log(f"[*] Mereset sesi RTSP (Data: CV={cv_bytes[0]}B, ESP={esp_bytes[0]}B)...")
                        with esp_lock:
                            if esp_conn == active_esp:
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

    threads = []
    for p in RTSP_PORTS:
        t = threading.Thread(target=serve_rtsp_port, args=(p,), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

if __name__ == '__main__':
    main()