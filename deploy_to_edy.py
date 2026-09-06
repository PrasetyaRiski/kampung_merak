import os
import tarfile
import paramiko
import sys

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

SERVER_IP = "76.76.76.188"
SERVER_USER = "edy"
SERVER_PASS = "@Qwerty1"
REMOTE_BASE_DIR = "/home/edy/merak"
REMOTE_FRONTEND_DIR = "/home/edy/merak/frontend_website"
REMOTE_TAR_PATH = "/home/edy/merak/frontend_project.tar.gz"

LOCAL_DIR = "f:/kampung-merak-inkubator-mqtt"
LOCAL_TAR_PATH = os.path.join(LOCAL_DIR, "frontend_project.tar.gz")

ITEMS_TO_INCLUDE = [
    "src",
    "public",
    "dist",
    "docs",
    "screenshots",
    "server",
    "fastapi-backend",
    "backend",
    "package.json",
    "package-lock.json",
    ".npmrc",
    "postcss.config.js",
    "tailwind.config.js",
    "vite.config.js",
    "index.html",
    "nginx.conf",
    "docker-compose.yml",
    "Dockerfile",
    ".dockerignore",
    ".env.example",
    "README.md",
    "SYSTEM_DOCUMENTATION.md",
    "RTSP_GUIDE.md",
    "LAPORAN_AUDIT_API_KAMPUNG_MERAK.pdf"
]

def filter_tar(tarinfo):
    if "node_modules" in tarinfo.name:
        return None
    if ".git" in tarinfo.name:
        return None
    if "__pycache__" in tarinfo.name:
        return None
    if tarinfo.name.endswith(".pyc"):
        return None
    if tarinfo.name.endswith(".db-wal") or tarinfo.name.endswith(".db-shm"):
        return None
    return tarinfo

print("[1/6] Mengemas berkas frontend_project.tar.gz...")
with tarfile.open(LOCAL_TAR_PATH, "w:gz") as tar:
    for item in ITEMS_TO_INCLUDE:
        item_path = os.path.join(LOCAL_DIR, item)
        if os.path.exists(item_path):
            print(f"  + Memasukkan {item}")
            tar.add(item_path, arcname=item, filter=filter_tar)
        else:
            print(f"  ! Lewati (tidak ada): {item}")

tar_size_mb = os.path.getsize(LOCAL_TAR_PATH) / (1024 * 1024)
print(f"Arsip lokal berhasil dibuat: {tar_size_mb:.2f} MB")

print(f"\n[2/6] Menghubungkan ke server {SERVER_IP} via SFTP/SSH...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)

sftp = client.open_sftp()
print("[3/6] Mengunggah frontend_project.tar.gz ke /home/edy/merak/...")
def progress(transferred, total):
    percent = (transferred / total) * 100
    print(f"\r  Progres unggah: {transferred:,}/{total:,} bytes ({percent:.1f}%)", end="", flush=True)

sftp.put(LOCAL_TAR_PATH, REMOTE_TAR_PATH, callback=progress)
print("\nUnggah selesai!")
sftp.close()

def run_cmd(cmd, desc):
    print(f"\n---> {desc}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())
    if err.strip():
        print("[INFO/STDERR]", err.strip())

# 4. Ekstraksi ke frontend_website
run_cmd(
    f"tar -xzf {REMOTE_TAR_PATH} -C {REMOTE_FRONTEND_DIR}",
    "Mengekstrak berkas terbaru ke /home/edy/merak/frontend_website"
)

# 5. Salin pembaruan backend ke /home/edy/merak/backend/fastapi-backend
run_cmd(
    f"cp {REMOTE_FRONTEND_DIR}/fastapi-backend/app/main.py /home/edy/merak/backend/fastapi-backend/app/main.py && "
    f"cp {REMOTE_FRONTEND_DIR}/fastapi-backend/app/schemas.py /home/edy/merak/backend/fastapi-backend/app/schemas.py",
    "Sinkronisasi endpoint /api/incubator/settings ke backend API"
)

# 6. Pastikan docker-compose.yml di /home/edy/merak mendukung port 80 dan 5050 (Cloudflare)
DOCKER_COMPOSE_CONTENT = """services:
  # 1. CCTV Stream Server (Flask + OpenCV)
  cctv-gateway:
    build: ./backend/server
    container_name: merak_cctv
    restart: always
    networks:
      - merak_net

  # 2. Frontend Web (React + Nginx)
  frontend:
    build: ./frontend_website
    container_name: merak_frontend
    restart: always
    ports:
      - "80:80"
      - "5050:80"
    depends_on:
      - cctv-gateway
    networks:
      - merak_net

volumes:
  mysql_data:

networks:
  merak_net:
    driver: bridge
"""

sftp2 = client.open_sftp()
with sftp2.file(f"{REMOTE_BASE_DIR}/docker-compose.yml", "w") as f:
    f.write(DOCKER_COMPOSE_CONTENT)
sftp2.close()
print("\n---> docker-compose.yml berhasil diperbarui (ports 80 & 5050)")

# 7. Rebuild frontend di docker
run_cmd(
    f"cd {REMOTE_BASE_DIR} && docker compose build frontend",
    "Membangun image Docker merak_frontend"
)

run_cmd(
    f"cd {REMOTE_BASE_DIR} && docker compose up -d frontend",
    "Menjalankan ulang kontainer merak_frontend"
)

# 8. Restart API backend agar endpoint baru aktif
run_cmd(
    "docker restart kampung-merak-api",
    "Memuat ulang kontainer kampung-merak-api"
)

# 9. Verifikasi
run_cmd(
    "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
    "Status seluruh kontainer Docker"
)

run_cmd(
    "curl -I http://localhost:80 && curl -I http://localhost:5050 && curl -I http://localhost:8000/api/incubator/settings",
    "Verifikasi HTTP Port 80, 5050, dan API Incubator Settings"
)

client.close()
print("\n✅ SELESAI! Server 76.76.76.188 berhasil diperbarui.")
