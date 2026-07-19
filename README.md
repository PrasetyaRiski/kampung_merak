# Kampung Merak - Dashboard Inkubator Telur Merak MQTT

Dashboard web berbasis React, Vite, Tailwind CSS, dan MQTT.js untuk **inkubator telur merak**. Proyek ini terbagi menjadi 3 komponen utama terpisah:
1. **Frontend:** Aplikasi web React (Vite).
2. **Backend API:** Server REST API Python (FastAPI) terhubung ke database MySQL.
3. **CCTV Server:** Jembatan streaming video OpenCV RTSP-to-MJPEG.

Penjelasan mendalam tentang cara kerja arsitektur sistem, diagram alur data, spesifikasi teknologi, serta skema integrasi database dapat dibaca pada berkas [**SYSTEM_DOCUMENTATION.md**](file:///f:/kampung-merak-inkubator-mqtt/SYSTEM_DOCUMENTATION.md).

---

## Fokus & Fitur Utama

- **Monitoring Real-Time:** Telemetri suhu & kelembaban dari sensor DHT22 via MQTT.
- **Kendali Aktuator:** Sakelar lampu candling LED & manual trigger mist maker.
- **Konfigurasi Ambang Batas:** Input batas atas/bawah kelembaban yang tersinkronisasi via MQTT.
- **Manajemen Telur:** Visualisasi nampan 50 slot telur (fertil, menetas, infertil, gagal, kosong) terhubung ke database.
- **Portal Penjualan & Kas:** Pencatatan kas keuangan masuk, diagram pendapatan, dan cetak Sertifikat DCA (Keaslian Silsilah Telur).
- **Katalog Telur Publik:** Brosur visual premium varietas merak (Javanese Green & Indian Blue) untuk umum.

---

## Panduan Menjalankan Sistem

Sistem ini sekarang menggunakan arsitektur cloud untuk backend database (terhubung ke server remote). Anda hanya perlu menjalankan 2 layanan lokal di terminal/CMD yang terpisah:

### 1. Menjalankan CCTV Server (Python OpenCV Gateway)
Layanan ini mengonversi aliran video RTSP dari kamera CCTV Bardi agar dapat dibaca langsung oleh tag HTML Image di web browser.

1. Buka terminal, masuk ke folder `server`:
   ```bash
   cd server
   ```
2. Install dependensi OpenCV & Flask (jika belum):
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan script gateway:
   ```bash
   python rtsp_gateway_example.py
   ```
   *(Layanan video stream akan aktif di port `5000`).*

---

### 2. Menjalankan Frontend Web (React + Vite)
Aplikasi website antarmuka pengguna.

1. Buka terminal baru di folder utama proyek (root).
2. Install dependensi Node.js (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server pengembang:
   ```bash
   npm run dev
   ```
4. Buka alamat website yang tampil di terminal Anda (biasanya `http://localhost:5173/`).

---

## Hak Akses Akun & Mode Demo
Aplikasi secara bawaan masuk sebagai **Viewer** (Mode Baca). Untuk mengubah peran menjadi Admin atau Operator:
1. Klik tombol **ikon Kunci/Key** (Login) di pojok kiri bawah (Sidebar).
2. Masukkan **Email** dan **Kata Sandi** Anda (contoh akun Admin: `admin@kampungmerak.id` | Sandi: `admin123`).
3. Sistem otomatis akan memberikan hak akses berdasarkan tipe akun (menyimpan Token JWT).

---

## Panduan Build Produksi (Frontend)
Untuk mengompilasi website menjadi berkas statis siap upload ke hosting Nginx/Cloudflare:
```bash
npm run build
npm run preview
```
Aset hasil build akan diexport ke folder `dist/`.
