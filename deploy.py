import os
import tarfile
import paramiko
import sys

# Pastikan output konsol tidak error saat ada karakter UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

SERVER_IP = "192.168.1.7"
SERVER_USER = "root"
SERVER_PASS = "openwifi"
REMOTE_TARGET_DIR = "/mnt/storage/www/web/kampung-merak-inkubator-mqtt"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
TAR_PATH = os.path.join(LOCAL_DIR, "deploy_bundle.tar.gz")

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
    if tarinfo.name.endswith(".db-wal") or tarinfo.name.endswith(".db-shm"):
        return None
    return tarinfo

print("[1/5] Membuat arsip berkas proyek terbaru...")
with tarfile.open(TAR_PATH, "w:gz") as tar:
    for item in ITEMS_TO_INCLUDE:
        item_path = os.path.join(LOCAL_DIR, item)
        if os.path.exists(item_path):
            print(f"  + Memasukkan {item}")
            tar.add(item_path, arcname=item, filter=filter_tar)
        else:
            print(f"  ! Lewati (tidak ditemukan): {item}")

tar_size_mb = os.path.getsize(TAR_PATH) / (1024 * 1024)
print(f"Arsip berhasil dibuat: {tar_size_mb:.2f} MB")

print(f"\n[2/5] Menghubungkan ke server {SERVER_IP} via SFTP/SSH...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=20)

sftp = client.open_sftp()
remote_tar_path = "/mnt/storage/www/web/deploy_bundle.tar.gz"

print(f"[3/5] Mengunggah arsip ke server...")
def progress(transferred, total):
    percent = (transferred / total) * 100
    print(f"\r  Progres unggah: {transferred:,}/{total:,} bytes ({percent:.1f}%)", end="", flush=True)

sftp.put(TAR_PATH, remote_tar_path, callback=progress)
print("\nUnggah selesai!")
sftp.close()

def run_cmd(cmd, desc):
    print(f"\n---> {desc}")
    stdin, stdout, stderr = client.exec_command(cmd)
    while True:
        line = stdout.readline()
        if not line:
            break
        try:
            print(" ", line.strip())
        except Exception:
            pass
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("  [INFO/LOG]", err.strip())

# 4. Ekstraksi berkas ke direktori server
run_cmd(
    f"tar -xzf {remote_tar_path} -C {REMOTE_TARGET_DIR} && rm -f {remote_tar_path}",
    "Mengekstrak berkas terbaru ke direktori server"
)

# 5. Build docker image
run_cmd(
    f"cd {REMOTE_TARGET_DIR} && docker compose build frontend",
    "Membangun image Docker kampung-merak-frontend"
)

# 6. Recreate and restart container
run_cmd(
    f"cd {REMOTE_TARGET_DIR} && docker compose up -d --force-recreate",
    "Menjalankan ulang kontainer Docker"
)

# 7. Verifikasi
run_cmd(
    f"cd {REMOTE_TARGET_DIR} && docker compose ps && curl -I http://127.0.0.1:8087/",
    "Memverifikasi status kontainer dan HTTP port 8087"
)

client.close()

if os.path.exists(TAR_PATH):
    os.remove(TAR_PATH)

print("\n Selesai! Web di server telah diperbarui ke versi terbaru.")
