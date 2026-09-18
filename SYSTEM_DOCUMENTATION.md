# Dokumentasi Sistem: Kampung Merak Inkubator IoT

> Dokumen ini adalah **satu-satunya sumber dokumentasi sistem** (single source of truth).
> Isi `RTSP_GUIDE.md` yang lama telah **digabung ke dokumen ini** (§3C + §5) dan file tersebut sudah dihapus (Opsi A).

Dokumen ini menjelaskan arsitektur, cara kerja, alur data (*data flow*), spesifikasi teknologi, dan panduan operasional yang **sesuai dengan kode frontend saat ini**, khususnya koneksi **MQTT telemetri** dan **CCTV**.

---

## 1. Ikhtisar Sistem (System Overview)

Sistem mendigitalisasi penangkaran telur merak: monitoring suhu/kelembaban real-time, kontrol aktuator (lampu/motor/mist), pencatatan telur/indukan/anakan, keuangan, serta live CCTV internal inkubator.

Tiga komponen utama:

1. **Frontend Web (Client-Side):** React + Vite + Tailwind. Satu-satunya yang dibahas detail di repo ini (`src/`).
2. **Backend API (Server-Side):** FastAPI + MySQL, diakses via `VITE_API_BASE_URL` (produksi: `https://api-merak.abdulrosyid.my.id`). Auth: `X-API-Key` (`VITE_API_KEY_WEB`) + JWT Bearer (`jwt_token` di localStorage). Wrapper: `src/utils/api.js`.
3. **CCTV Stream Server (Video Gateway):** Python Flask + OpenCV (`server/rtsp_gateway_example.py`, port `5000`). Mengubah RTSP kamera Bardi menjadi MJPEG `multipart/x-mixed-replace` agar bisa ditampilkan browser via Nginx reverse proxy.

---

## 2. Spesifikasi Teknologi (Tech Stack)

### A. Frontend (Aplikasi Web)

- **Framework:** React 19 + Vite 6 (`package.json`: `react ^19.1.0`, `vite ^6.3.5`, `@vitejs/plugin-react ^4.3.4`).
- **Styling & UI:** Tailwind CSS (tema *Forest Midnight* / *Teal Iridescence*).
- **Konektivitas IoT:** `mqtt ^5.10.4` (`mqtt.js`) via **WebSocket Secure** (`wss://...:8884/mqtt`). Implementasi: `src/hooks/useMqttBridge.js`.
- **Grafik:** `IncubationTrendChart.jsx` (tren suhu/kelembaban live) + `HatcheryPerformanceChart.jsx` (khusus admin).
- **Penyimpanan lokal:** `localStorage` — `km_page`, `km_role`, `km_verified_roles`, `km_dark_mode`, `km_active_variety`, `km_cctv_url`, `km_eggs`, `km_peafowl`, `km_sales`, `km_finance`, `jwt_token`, `user_info`.
- **Lazy pages:** `CctvPage`, `EggPage`, `SettingsPage`, `AccountsPage`, `SalesPage`, `FinancePage`, `KatalogPage`, `BreedersPage`, `ChicksPage` (lihat `src/App.jsx`).

### B. Backend REST API (yang dikonsumsi frontend)

- **Base URL:** `VITE_API_BASE_URL` (produksi: `https://api-merak.abdulrosyid.my.id`; dev diproxy via `vite.config.js` `/api`, `/auth`; prod diproxy via `nginx.conf` `/api/`, `/auth/`).
- **Auth:** header `X-API-Key` + `Authorization: Bearer <JWT>` (lihat `src/utils/api.js:1-56`).
- **Endpoint yang dipakai frontend saat ini:**
  - `GET /api/eggs`, `POST /api/eggs`, `PUT /api/eggs/:id`, `DELETE /api/eggs/:id`
  - `GET /api/breeders`, `GET /api/sales`, `POST/PUT/DELETE /api/sales/:id`
  - `GET /api/finance`, `POST/PUT/DELETE /api/finance/:id`
  - `GET /api/dashboard/summary`, `GET/POST /api/incubator/status`
  - `GET /api/incubator/settings` (sumber config MQTT — lihat §3A)
  - `GET /api/incubator/telemetry-logs`, `GET/POST /api/incubator/rotation-logs`
  - `GET /auth/me` (restore sesi, mapping `pemilik→admin`, `staff→operator`)
- **Fallback luring:** jika `VITE_API_BASE_URL === undefined`, `fetchApi` throw dan state bertahan di `localStorage` (lihat `src/App.jsx:71-72,223-244`).

### C. CCTV Stream Server (Video Gateway)

- **File:** `server/rtsp_gateway_example.py` (Flask 3.0.3, `opencv-python 4.10.0.84`, `python-dotenv 1.0.1` — lihat `server/requirements.txt`). Image Docker: `server/Dockerfile` (`python:3.12-slim`, expose `5000`).
- **Pola:** `CameraStreamer` — satu background thread per kamera, `cv2.VideoCapture(RTSP, CAP_FFMPEG)` + `CAP_PROP_BUFFERSIZE=1`, baca ~28 FPS, encode JPEG quality `82`, sajikan ~25 FPS ke semua viewer tanpa membuka koneksi RTSP baru per viewer.
- **Optimasi FFMPEG:** `rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|stimeout;8000000` (anti-delay, timeout 8 dtk).
- **Ketahanan:** resize proporsional max `1280x720`, standby frame diagnostik (`create_standby_frame`) saat offline agar `<img>` tidak blank hitam, password di-mask (`mask_rtsp_url`), reconnect otomatis (retry 2 dtk, break setelah 5x gagal baca, `is_alive()` = frame < 4.5 dtk).
- **Relay check:** jika URL mengandung `127.0.0.1`, gateway cek `http://127.0.0.1:9001/status` (`esp_connected`) sebelum membuka capture.

---

## 3. Cara Kerja & Alur Data (System Flow)

### A. Alur Pemantauan Sensor Real-time — MQTT Telemetri (sesuai `useMqttBridge.js` + `constants.js`)

```mermaid
sequenceDiagram
    participant ESP as ESP32 / DHT22
    participant Broker as HiveMQ Cloud (WSS :8884)
    participant API as FastAPI Backend
    participant Web as React Browser (useMqttBridge)
    participant DB as MySQL

    Web->>API: GET /api/incubator/settings (mqtt_url, username, password)
    API-->>Web: config (fallback ke VITE_MQTT_* / hardcode bila gagal)
    ESP->>Broker: Publish iot/telemetry/* (temperature, humidity, status_lamp/motor/mist)
    Broker->>Web: Live update via mqtt.js WebSocket
    Note over Web: Update StatCard + Trend Chart real-time,<br/>tanpa query DB tiap detik
    Note over Web: Throttling 60 detik
    Web->>API: POST /api/incubator/status (suhu_sekarang, kelembapan_sekarang, lampu_status)
    API->>DB: Simpan status + telemetry-logs
    Web->>API: GET /api/dashboard/summary + GET /api/incubator/status (fallback bila MQTT null)
```

1. **Sumber konfigurasi MQTT (prioritas berurutan)** — `src/hooks/useMqttBridge.js:47-60`:
   1. `GET /api/incubator/settings` (`mqtt_url`, `mqtt_username`, `mqtt_password`),
   2. `.env`: `VITE_MQTT_URL=wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt`, `VITE_MQTT_USERNAME`, `VITE_MQTT_PASSWORD`,
   3. hardcode fallback di kode (`wss://9170ac9...s1.eu.hivemq.cloud:8884/mqtt` / `endoqmerak`).
   > Catatan: label `MQTT (EMQX Cloud)` di `SettingsPage.jsx:77` sudah kadaluarsa — yang dipakai adalah **HiveMQ Cloud**.
2. **Subscribe (5 topik)** — `src/data/constants.js:4-28` (`SUBSCRIBE_TOPICS`):
   `iot/telemetry/temperature`, `iot/telemetry/humidity`, `iot/telemetry/status_lamp`, `iot/telemetry/status_motor`, `iot/telemetry/status_mist`.
   Status dinormalisasi `ON/OFF/UNKNOWN` (`normalizeStatus`).
3. **Publish perintah (QoS 0, retain false)** — `src/hooks/useMqttBridge.js:147-164`:
   `iot/cmd/lamp_thresh_on`, `lamp_thresh_off`, `humidity_thresh_low/high`, `lamp_mode`, `motor_turns`, `motor_trigger`, `mist_trigger`, `candling_mode`, `alert_ack`.
4. **Klien MQTT:** `clientId=kampung-merak-inkubator-<rand>`, `clean:true`, `keepalive:30`, `connectTimeout:10000`, `reconnectPeriod:3000`, `protocolVersion:4`. Status UI: `idle/connecting/connected/reconnecting/offline/error` (`statusText`, `ConnectionPanel.jsx`, `StatusBadge.jsx`). Log RX/TX max 32 entri (`SystemLogs.jsx`).
5. **Throttling DB (60 detik)** — `src/App.jsx:269-300`: kirim `POST /api/incubator/status`, **bukan** `POST /api/telemetry` dan **bukan** tabel `telemetry_logs` secara langsung seperti dokumen lama. Riwayat dibaca via `GET /api/incubator/telemetry-logs` + `rotation-logs` (`SensorHistoryPage.jsx`).
   > ⚠️ Known bug saat dokumen ini ditulis: `App.jsx:275` memeriksa `telemetry.temp` padahal state-nya `telemetry.temperature`/`telemetry.humidity`, sehingga blok throttling tidak pernah lolos. Perbaiki ke `telemetry.temperature` agar sync jalan.
6. **Fallback REST:** `DashboardPage.jsx:52-54` — jika telemetri MQTT `null`, tampilkan `incubatorStatus.suhu_sekarang/kelembapan_sekarang` + label `Topik: iot/telemetry/... (Live MQTT)` vs `Data Terakhir Database (REST API)`.

---

### B. Alur Manajemen Data & Keuangan (Database Sync Flow)

```mermaid
graph TD
    User([Pengguna]) -->|Input/Edit UI| React[React Frontend + localStorage]
    React -->|fetchApi + X-API-Key + JWT| API[FastAPI: api-merak.abdulrosyid.my.id]
    API -->|SQL| DB[(MySQL)]
    React -->|On mount GET /api/eggs breeders sales finance incubator/status| API
```

1. **Inisialisasi:** `App.jsx:223-244` — `Promise.allSettled` memuat `eggs/breeders/sales/finance/status` saat mount jika `VITE_API_BASE_URL` terdefinisi.
2. **Sync cerdas (diff lama vs baru)** — `App.jsx:67-185` (`setEggs/setSales/setFinance`): tambah → `POST`, ubah → `PUT /:id`, hapus → `DELETE /:id`. Gagal sync hanya `console.error`, state lokal tetap jalan.
3. **Proteksi data:** `FinancePage/SalesPage` reload ulang setelah login (`App.jsx:507-514`).

---

### C. Alur Live Stream CCTV (Video Stream Flow — merger dari `RTSP_GUIDE.md`)

Browser tidak bisa membuka `rtsp://` langsung, apalagi dari halaman HTTPS (mixed-content). Arsitektur yang dipakai kode saat ini:

```mermaid
graph LR
    CCTV[IP Camera Bardi<br/>RTSP H.264] -->|RTSP TCP| GW[Gateway Flask+OpenCV<br/>server/rtsp_gateway_example.py :5000]
    GW -->|CameraStreamer: 1x VideoCapture,<br/>resize max 1280x720, JPEG q82| MJPEG[Multipart MJPEG<br/>multipart/x-mixed-replace]
    MJPEG -->|Nginx reverse proxy<br/>cctv-gateway:5000| Web[Browser img + health polling]
    SET[SettingsPage<br/>km_cctv_url localStorage] -.->|display + query ?url=| Web
```

1. **Pengambilan:** `CameraStreamer(INCUBATOR_RTSP_URL)` membuka `cv2.VideoCapture` sekali di background dan dipakai semua viewer. Env produksi (`.env` root): `INCUBATOR_RTSP_URL=rtsp://admin:Admin123@100.100.162.120:8555/V_ENC_000`, `KANDANG_RTSP_URL=...@100.100.162.120:8555/...` (Tailscale, port `8555`). Contoh lama `192.168.110.227:554` hanya default di `App.jsx:59` (`km_cctv_url`) dan `server/.env` contoh — sesuaikan ke IP kamera aktual.
2. **Endpoint gateway** (`server/rtsp_gateway_example.py:187-236`):

   | Endpoint | Fungsi saat ini |
   |---|---|
   | `GET /video_feed` | MJPEG inkubator (streamer aktif) |
   | `GET /kandang_feed` | Saat ini reuse streamer yang sama (placeholder kamera ke-2) |
   | `GET /health` + `GET /cctv_health` | JSON `{status, service, incubator_reachable, stream_source, incubator_target(masked), incubator_endpoint, kandang_endpoint}` |
3. **Konsumsi frontend** (`src/pages/CctvPage.jsx`):
   - Base URL: `import.meta.env.VITE_RTSP_MJPEG_URL || "/video_feed"` (produksi wajib relative path `/video_feed`, bukan `http://localhost:5000/...` agar lolos HTTPS/mixed-content).
   - URL aktual: `` `${mjpegBase}?url=${encodeURIComponent(cctvUrl)}&t=${incKey}` `` + `onError → OFFLINE` + tombol reload (cache-busting `t=`).
   - Health polling: `fetch("/cctv_health")` tiap 8 detik → `incubator_reachable` → badge `LIVE / MENYAMBUNG / OFFLINE`. IP display diekstrak via regex dari `cctvUrl`.
   > ⚠️ Limitasi saat ini: gateway **mengabaikan query `?url=`** dan selalu memakai env `INCUBATOR_RTSP_URL`. Jadi input di Pengaturan (`SettingsPage.jsx:113-163`, hanya Admin/Operator via `canConfigureCctv`) baru berpengaruh penuh setelah gateway dibuat dinamis atau env-nya diubah + restart. Jangan menganggap ganti di UI langsung ganti sumber RTSP server.
4. **Nginx (prod, `nginx.conf:48-69`):**

   ```nginx
   location /video_feed  { proxy_pass http://cctv-gateway:5000/video_feed;  proxy_buffering off; proxy_read_timeout 86400s; proxy_send_timeout 86400s; proxy_set_header Host $host; }
   location /kandang_feed { proxy_pass http://cctv-gateway:5000/kandang_feed; proxy_buffering off; proxy_read_timeout 86400s; proxy_send_timeout 86400s; proxy_set_header Host $host; }
   location /cctv_health { proxy_pass http://cctv-gateway:5000/health; proxy_set_header Host $host; }
   ```

   `proxy_buffering off` wajib agar MJPEG tidak patah. Service name `cctv-gateway` adalah DNS Docker; `docker-compose.yml` saat ini memakai hack `extra_hosts: cctv-gateway:127.0.0.1` untuk single-host.
5. **Dev proxy (`vite.config.js:28-31`):** hanya `/video_feed → http://127.0.0.1:5000`. Known gap: `/kandang_feed` dan `/cctv_health` belum diproxy sehingga health-check gagal saat `npm run dev` — tambahkan bila ingin parity dev/prod.

---

## 4. Keamanan & Hak Akses (Role Permission Model)

Sumber: `src/data/constants.js:100-154` (`ROLES`, `ROLE_ACCESS_CODES`).

- **Admin (`pemilik`):** `allowed: dashboard, kamera, telur, indukan, anakan, katalog, pengaturan, akun, penjualan, finance`. `canControl/canConfigure/canConfigureCctv/canEditEggs/canManagePeafowl/Chicks/Sales/Users/canAcknowledge/canViewBusinessAnalytics = true`.
- **Operator (`staff`):** `allowed: dashboard, kamera, telur, indukan, anakan, katalog, pengaturan`. Bisa kontrol + konfigurasi CCTV + edit telur, tapi `canManageSales/Users/canViewBusinessAnalytics = false`.
- **Viewer:** `allowed: dashboard, kamera, telur, indukan, anakan, katalog`. Semua kontrol dikunci (`canControl=false`).
- **Mekanisme:** JWT (`/auth/me` → mapping role server ke UI di `App.jsx:200-221,498-503`) + kode akses `VITE_ADMIN/OPERATOR_ACCESS_CODE` (`RoleVerificationModal`) + autora UI `AccessDenied`. Catatan `.env.example`: untuk produksi, otorisasi sensitif harus ditegakkan di backend, bukan hanya frontend.

---

## 5. Panduan Operasional CCTV & Gateway (pindahan `RTSP_GUIDE.md`, disesuaikan kode)

### 5.1 Prasyarat PC Server / Edge Kandang

- Satu jaringan dengan kamera; bisa `ping` IP kamera aktual (contoh produksi: `100.100.162.120`, bukan contoh lama `192.168.110.227` kecuali itu IP Anda).
- Terinstall **Python 3.12+** (lihat `server/Dockerfile`), **Nginx** (prod) atau Docker.
- Port `5000` (gateway) hanya diakses via Nginx (`/video_feed`, `/kandang_feed`, `/cctv_health`), jangan expose langsung ke internet.

### 5.2 Konfigurasi

Root `.env` (frontend, wajib rebuild setelah ubah):

```env
VITE_RTSP_MJPEG_URL=/video_feed
INCUBATOR_RTSP_URL=rtsp://admin:Admin123@100.100.162.120:8555/V_ENC_000
KANDANG_RTSP_URL=rtsp://admin:Admin123@100.100.162.120:8555/V_ENC_000
```

`server/.env` (gateway, dibaca via `load_dotenv()`):

```env
INCUBATOR_RTSP_URL=rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000
KANDANG_RTSP_URL=rtsp://username:password@192.168.1.21:554/stream1
```

> Samakan kedua file ke IP kamera sebenarnya. Default UI `km_cctv_url` di `App.jsx:59` masih contoh lama — perbarui via halaman Pengaturan (Admin/Operator) atau ubah default kode bila perlu.

Build ulang:

```bash
npm install
npm run build
```

### 5.3 Menjalankan Gateway

```bash
cd server/
python -m venv venv
# Linux
source venv/bin/activate
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt
python rtsp_gateway_example.py
# cek: curl http://127.0.0.1:5000/health
```

Produksi: gunakan **Systemd/Supervisor/PM2** (bare-metal) atau Docker (`server/Dockerfile` → `python rtsp_gateway_example.py`, expose `5000`). Gateway log `[CCTV-Inkubator] ...` menunjukkan status `VideoCapture`.

### 5.4 Nginx Reverse Proxy

Gunakan blok persis `nginx.conf` (§3C.4). Reload:

```bash
# Linux
sudo systemctl reload nginx
# Windows (admin)
nginx -s reload
```

Jangan set `VITE_RTSP_MJPEG_URL=http://localhost:5000/video_feed` di produksi — gunakan `/video_feed`.

### 5.5 Troubleshooting

1. **OFFLINE di `CctvPage`:** cek `terminal gateway` (`Gagal membuka stream`), `curl /health` (`incubator_reachable:false` → standby frame), pastikan IP/port/user/pass benar, gunakan Static IP/DHCP Reservation. Frontend juga tampilkan `MENYAMBUNG` saat `fetch /cctv_health` gagal (network error diabaikan).
2. **Lag/patah:** pastikan `proxy_buffering off;`, manfaatkan resize bawaan max 720p + JPEG q82; resolusi Bardi asli terlalu besar bila tidak di-resize.
3. **HTTPS/CORS/mixed-content:** wajib relative path + akses via Nginx yang sama-origin. Dev: tambah proxy `/kandang_feed` + `/cctv_health` di `vite.config.js` bila dibutuhkan.
4. **Ganti kamera via UI tidak berpengaruh:** normal untuk saat ini karena gateway mengabaikan `?url=` (lihat §3C.3). Ubah env + restart gateway.
5. **`Server/.env` vs root `.env` beda IP:** samakan manual; tidak ada sinkronisasi otomatis.

---

*Dokumen ini dirancang untuk deployment terpusat (PC Server / Edge Server Kandang) + backend remote `api-merak.abdulrosyid.my.id`. Perbarui dokumen ini setiap kali topik MQTT, endpoint `/api/*`, `/video_feed|/kandang_feed|/cctv_health`, atau env berubah.*
