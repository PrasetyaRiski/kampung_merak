# Panduan CCTV & RTSP Gateway Kampung Merak

Dokumen ini menjelaskan arsitektur dan langkah-langkah untuk menjalankan *live stream* CCTV (Kamera Bardi/RTSP) di dalam aplikasi Kampung Merak, terutama saat di-*deploy* secara produksi di PC Server lokal (kandang).

---

## 🏗️ 1. Arsitektur Jaringan (Cara Kerjanya)

Browser modern yang memuat web secara HTTPS (Aman) **tidak diizinkan** memuat video RTSP (TCP) secara langsung maupun HTTP stream yang tidak aman.
Untuk mengatasi ini, arsitektur yang digunakan adalah:

1. **Kamera Bardi (CCTV)** memancarkan video mentah via protokol `RTSP` (contoh: `rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000`).
2. **Gateway Python (`server/rtsp_gateway_example.py`)** menangkap stream RTSP tersebut, memberikan efek (OpenCV overlay), lalu menyajikannya ulang dalam format `MJPEG` HTTP Stream di port `5000`.
3. **Nginx Web Server** bertindak sebagai perantara (Reverse Proxy). Jika browser meminta URL `/video_feed`, Nginx secara internal akan mengambil video dari port `5000` Python dan meneruskannya ke browser dengan keamanan HTTPS.
4. **React Frontend** hanya memanggil *relative path* `VITE_RTSP_MJPEG_URL=/video_feed`, sehingga browser tidak memblokir *(Mixed Content)*.

---

## 🚀 2. Prasyarat Server (PC Server Kandang)

Pastikan PC Server Anda:
- Berada di jaringan WiFi/LAN yang sama dengan Kamera CCTV.
- Bisa melakukan "ping" ke IP kamera (contoh: `ping 192.168.110.227`).
- Sudah terinstall **Python 3.8+** dan **Nginx**.

---

## 🛠️ 3. Langkah-langkah Menjalankan (Production)

Ikuti urutan ini untuk memastikan stream CCTV berjalan mulus di server Anda:

### Tahap 1: Konfigurasi Frontend
Pastikan file `.env` di direktori utama proyek memiliki pengaturan berikut:
```env
VITE_RTSP_MJPEG_URL=/video_feed
INCUBATOR_RTSP_URL=rtsp://admin:Admin123@[IP_LOKAL_KAMERA]:554/V_ENC_000
```
Setelah diubah, selalu jalankan proses build ulang untuk UI:
```bash
npm install
npm run build
```

### Tahap 2: Menjalankan Gateway Python (OpenCV)
Buka terminal baru di direktori `server/`.
Disarankan menggunakan *virtual environment* (venv):

```bash
cd server/

# Buat virtual environment (hanya pertama kali)
python -m venv venv

# Aktifkan venv (Windows)
.\venv\Scripts\activate
# ATAU (Linux/Ubuntu)
source venv/bin/activate

# Install library pendukung (hanya pertama kali)
pip install -r requirements.txt

# Jalankan Gateway
python rtsp_gateway_example.py
```
*Tip Produksi:* Agar gateway terus berjalan meskipun PC Server di-restart, sangat disarankan menjalankan script python ini menggunakan **PM2**, **Supervisor**, atau **Systemd** (jika di Linux).

### Tahap 3: Memulai Nginx Reverse Proxy
Konfigurasi file Nginx (biasanya di `/etc/nginx/nginx.conf` atau `/etc/nginx/sites-available/default` pada Linux) wajib mencantumkan blok ini di dalam blok `server {}`:

```nginx
    location /video_feed {
        proxy_pass http://127.0.0.1:5000/video_feed;
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
```
Lalu muat ulang (*reload*) layanan Nginx:
```bash
# Ubuntu / Linux
sudo systemctl reload nginx

# Windows (Command Prompt Administrator)
nginx -s reload
```

---

## ⚠️ 4. Troubleshooting (Pemecahan Masalah)

1. **Gambar Blank / Offline di Halaman Dashboard:**
   - Periksa terminal tempat `rtsp_gateway_example.py` berjalan. Apakah ada error `Gagal membuka koneksi RTSP`? Jika ya, kemungkinan kamera mati atau IP-nya berubah (Pastikan Anda menggunakan fitur *Static IP / DHCP Reservation* pada router untuk CCTV).
2. **Video Bergerak Patah-patah (Lag):**
   - Resolusi asli kamera bardi sangat tinggi. Pastikan kode OpenCV meresize video (`cv2.resize`) dan *buffering* pada Nginx sudah di matikan (`proxy_buffering off;`).
3. **CORS atau HTTPS Error di Browser:**
   - Pastikan variabel `VITE_RTSP_MJPEG_URL` diatur ke `/video_feed`, BUKAN `http://localhost:5000/video_feed`. Jangan lupa build ulang (`npm run build`) setelah menggantinya.

---
*Dokumentasi ini dirancang khusus untuk deployment di satu mesin terpusat (PC Server / Edge Server Kandang).*
