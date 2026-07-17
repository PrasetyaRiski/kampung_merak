# Kampung Merak — PavoPrecise RESTful API

Sistem monitoring dan manajemen penetasan telur merak (peafowl) berbasis IoT. Terdiri dari REST API untuk manajemen data peternakan dan gateway CCTV untuk streaming kamera inkubator.

## Struktur Project

```
kampung-merak-inkubator-mqtt/
├── docker-compose.yml              # Orkestrasi container (MySQL + API + CCTV)
├── AGENT.md                        # Spesifikasi teknis & data model (single source of truth)
├── fastapi-backend/                # REST API backend (FastAPI)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── main.py                 # Entrypoint, middleware, startup seed
│       ├── database.py             # Koneksi database (MySQL / SQLite)
│       ├── models.py               # SQLAlchemy models (11 tabel)
│       ├── schemas.py              # Pydantic schemas
│       ├── auth.py                 # JWT, bcrypt, role checker
│       └── routers/
│           ├── auth.py             # Register, login, me
│           ├── breeders.py         # Manajemen indukan + lineage + compare
│           ├── eggs.py             # Manajemen telur
│           ├── chicks.py           # Manajemen anakan
│           ├── incubator.py        # Settings, status, telemetry, rotation logs
│           ├── sales.py            # Manajemen penjualan
│           ├── finance.py          # Pemasukan/pengeluaran (pemilik only)
│           ├── dashboard.py        # Ringkasan dashboard
│           ├── alerts.py           # Notifikasi & alert
│           └── users.py            # Manajemen user (pemilik only)
├── server/                         # RTSP / CCTV gateway (Flask + OpenCV)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── rtsp_gateway_example.py     # Stream MJPEG + OpenCV overlay
└── README.md
```

## Cara Menjalankan

### Docker (Rekomendasi)

```bash
docker compose up -d --build
```

Service akan berjalan di:

| Service       | URL                           |
|---------------|-------------------------------|
| MySQL         | `localhost:3307`              |
| FastAPI       | `http://localhost:8000`       |
| CCTV Gateway  | `http://localhost:5000`       |

Untuk URL kamera RTSP kustom:

```bash
INCUBATOR_RTSP_URL="rtsp://user:pass@192.168.1.20:554/stream1" \
KANDANG_RTSP_URL="rtsp://user:pass@192.168.1.21:554/stream1" \
docker compose up -d
```

### Lokal (Tanpa Docker)

**Backend:**

```bash
cd fastapi-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Database akan otomatis pakai **SQLite** jika `MYSQL_HOST` tidak di-set.

**CCTV Gateway:**

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python rtsp_gateway_example.py
```

## API Documentation

Base URL: `http://localhost:8000`

Interactive docs (Swagger UI): `http://localhost:8000/docs`

### Autentikasi & Keamanan

Semua request (termasuk endpoint publik) **wajib** menyertakan header `X-API-Key`.

| Header           | Wajib | Keterangan                                   |
|------------------|-------|----------------------------------------------|
| `X-API-Key`      | Ya    | Semua endpoint (kecuali `/docs`)             |
| `Authorization`  | Kondisional | `Bearer <token>` — wajib untuk endpoint yang butuh login |

**Role system:**

| Role      | Login | Akses                                                     |
|-----------|-------|-----------------------------------------------------------|
| `pemilik` | Ya    | Full akses semua modul, termasuk Finance & User Management |
| `staff`   | Ya    | Kelola data operasional, lihat Sales. Tidak bisa Finance   |
| viewer    | Tidak | Hanya GET endpoint publik (data operasional)              |

**Seed admin:** Saat pertama kali startup, user `USR-001` (pemilik) dibuat otomatis.  
Default: `admin@kampungmerak.id` / `admin123` (ganti di produksi via `.env`).

### Endpoints

#### Auth
| Method | Endpoint           | Role                          |
|--------|--------------------|-------------------------------|
| POST   | `/auth/register`   | pemilik                       |
| POST   | `/auth/login`      | publik (X-API-Key saja)       |
| GET    | `/auth/me`         | pemilik, staff                |

#### Breeder (Indukan)
| Method | Endpoint                     | Role                          |
|--------|------------------------------|-------------------------------|
| GET    | `/api/breeders`              | publik                        |
| GET    | `/api/breeders/{id}`         | publik                        |
| GET    | `/api/breeders/{id}/lineage` | publik (silsilah)             |
| GET    | `/api/breeders/compare?ids=A,B` | publik (perbandingan performa) |
| POST   | `/api/breeders`              | pemilik, staff                |
| PUT    | `/api/breeders/{id}`         | pemilik, staff                |
| DELETE | `/api/breeders/{id}`         | pemilik                       |

**Schema Breeder:**
```json
{
  "id": "MRK-F0-001",
  "nama": "opsional",
  "jenis_kelamin": "jantan | betina",
  "tanggal_lahir": "2026-01-01",
  "generasi": "F0",
  "varian_warna": "Hijau | Biru | Putih",
  "asal": "beli | ternak_sendiri",
  "status": "breeding | resting | ready_for_sale",
  "parent_jantan_id": "MRK-F0-000",
  "parent_betina_id": "MRK-F0-000"
}
```

**Response detail** (GET by ID) menambahkan: `total_telur`, `persentase_fertil`, `jumlah_anakan` — dihitung otomatis via live query.

#### Egg (Telur)
| Method | Endpoint           | Role                          |
|--------|--------------------|-------------------------------|
| GET    | `/api/eggs`        | publik                        |
| GET    | `/api/eggs/{id}`   | publik                        |
| POST   | `/api/eggs`        | pemilik, staff                |
| PUT    | `/api/eggs/{id}`   | pemilik, staff                |
| DELETE | `/api/eggs/{id}`   | pemilik                       |

**Schema Egg:**
```json
{
  "id": "EGG-APR25-001",
  "slot": 1,
  "induk_jantan_id": "MRK-F0-001",
  "induk_betina_id": "MRK-F0-001",
  "tanggalMasuk": "2026-04-01",
  "fertilitas": "Fertil | Infertil | Belum dicek",
  "akhir": "Menetas | Gagal | Proses",
  "catatan": "opsional"
}
```

#### Chick (Anakan / Hatchery)
| Method | Endpoint           | Role                          |
|--------|--------------------|-------------------------------|
| GET    | `/api/chicks`      | publik                        |
| GET    | `/api/chicks/{id}` | publik                        |
| POST   | `/api/chicks`      | pemilik, staff                |
| PUT    | `/api/chicks/{id}` | pemilik, staff                |
| DELETE | `/api/chicks/{id}` | pemilik                       |

**Schema Chick:**
```json
{
  "id": "CHK-001",
  "egg_id": "EGG-APR25-001",
  "tanggal_menetas": "2026-07-17",
  "berat_awal": 85.50,
  "skor_kesehatan": "baik",
  "status": "newborn | growing | ready_for_sale | sold",
  "foto_url": "opsional",
  "catatan": "opsional"
}
```

#### Incubator
| Method | Endpoint                              | Role                          |
|--------|---------------------------------------|-------------------------------|
| GET    | `/api/incubator/settings`             | publik                        |
| PUT    | `/api/incubator/settings`             | pemilik, staff                |
| GET    | `/api/incubator/status`               | publik                        |
| POST   | `/api/incubator/status`               | device/internal (X-API-Key)   |
| GET    | `/api/incubator/telemetry-logs`       | publik                        |
| POST   | `/api/incubator/telemetry-logs`       | internal                      |
| GET    | `/api/incubator/rotation-logs`        | publik                        |
| POST   | `/api/incubator/rotation-logs`        | internal                      |

**Auto-alert:** Saat `POST /api/incubator/status`, sistem otomatis membuat Alert jika suhu/kelembapan keluar dari range yang ditentukan di IncubatorSettings.

#### Sales (Penjualan)
| Method | Endpoint            | Role                          |
|--------|---------------------|-------------------------------|
| GET    | `/api/sales`        | publik                        |
| GET    | `/api/sales/{id}`   | publik                        |
| POST   | `/api/sales`        | pemilik, staff                |
| PUT    | `/api/sales/{id}`   | pemilik, staff                |
| DELETE | `/api/sales/{id}`   | pemilik                       |

#### Finance (Keuangan)
| Method | Endpoint              | Role                          |
|--------|-----------------------|-------------------------------|
| GET    | `/api/finance`        | pemilik                       |
| GET    | `/api/finance/{id}`   | pemilik                       |
| POST   | `/api/finance`        | pemilik                       |
| PUT    | `/api/finance/{id}`   | pemilik                       |
| DELETE | `/api/finance/{id}`   | pemilik                       |

#### Dashboard
| Method | Endpoint                   | Role                          |
|--------|----------------------------|-------------------------------|
| GET    | `/api/dashboard/summary`   | pemilik, staff                |

Response berbeda per role — field `finance_summary` (total pemasukan, pengeluaran, saldo) hanya muncul untuk role `pemilik`.

#### Alerts (Notifikasi)
| Method | Endpoint                 | Role                          |
|--------|--------------------------|-------------------------------|
| GET    | `/api/alerts`            | pemilik, staff                |
| PUT    | `/api/alerts/{id}/read`  | pemilik, staff                |
| DELETE | `/api/alerts/{id}`       | pemilik                       |

Alert dibuat otomatis oleh sistem saat:
- Suhu inkubator keluar dari range
- Kelembapan inkubator keluar dari range
- Rotasi telur gagal

#### User Management
| Method | Endpoint          | Role                          |
|--------|-------------------|-------------------------------|
| GET    | `/api/users`      | pemilik                       |
| PUT    | `/api/users/{id}` | pemilik                       |
| DELETE | `/api/users/{id}` | pemilik                       |

## CCTV Stream

| Endpoint                              | Keterangan              |
|---------------------------------------|-------------------------|
| `http://localhost:5000/video_feed`    | Stream kamera inkubator |
| `http://localhost:5000/kandang_feed`  | Stream kamera kandang   |
| `http://localhost:5000/health`        | Cek status service      |

Fitur:
- Overlay deteksi kontur OpenCV otomatis
- Auto-reconnect jika kamera terputus
- URL kustom via parameter `?url=rtsp://...`

## Database

### Entity Relationship — 11 Models

**Users**
| Kolom           | Tipe         | Keterangan                         |
|-----------------|--------------|------------------------------------|
| id              | VARCHAR(50)  | Primary key (USR-xxx)              |
| email           | VARCHAR(255) | Unique, untuk login                |
| hashed_password | VARCHAR(255) | Hash bcrypt                        |
| nama            | VARCHAR(255) | Nama lengkap                       |
| role            | VARCHAR(50)  | `pemilik` / `staff`                |
| created_at      | DATETIME     |                                   |

**Breeders**
| Kolom             | Tipe         | Keterangan                         |
|-------------------|--------------|------------------------------------|
| id                | VARCHAR(50)  | Primary key (MRK-F0-xxx)           |
| nama              | VARCHAR(255) | Nullable                           |
| jenis_kelamin     | ENUM         | jantan / betina                    |
| tanggal_lahir     | DATE         | Nullable                           |
| generasi          | VARCHAR(50)  | F0, F1, F2, dst                    |
| varian_warna      | VARCHAR(100) | Hijau, Biru, Putih, dll            |
| asal              | ENUM         | beli / ternak_sendiri              |
| status            | ENUM         | breeding / resting / ready_for_sale|
| foto_url          | VARCHAR(500) | Nullable                           |
| parent_jantan_id  | VARCHAR(50)  | FK -> Breeders.id, nullable        |
| parent_betina_id  | VARCHAR(50)  | FK -> Breeders.id, nullable        |
| created_at        | DATETIME     |                                   |

**Eggs**
| Kolom             | Tipe         | Keterangan                         |
|-------------------|--------------|------------------------------------|
| id                | VARCHAR(50)  | Primary key (EGG-xxx)              |
| slot              | INT (unique) | Nomor slot inkubator (1-100)       |
| induk_jantan_id   | VARCHAR(50)  | FK -> Breeders.id                  |
| induk_betina_id   | VARCHAR(50)  | FK -> Breeders.id                  |
| tanggalMasuk      | VARCHAR(50)  | ISO date                           |
| fertilitas        | ENUM         | Fertil / Infertil / Belum dicek    |
| akhir             | ENUM         | Menetas / Gagal / Proses           |
| catatan           | TEXT         | Nullable                           |

**Chicks**
| Kolom             | Tipe         | Keterangan                         |
|-------------------|--------------|------------------------------------|
| id                | VARCHAR(50)  | Primary key (CHK-xxx)              |
| egg_id            | VARCHAR(50)  | FK -> Eggs.id                      |
| induk_jantan_id   | VARCHAR(50)  | Denormalized dari Egg              |
| induk_betina_id   | VARCHAR(50)  | Denormalized dari Egg              |
| tanggal_menetas   | DATE         |                                   |
| berat_awal        | NUMERIC(6,2) | Gram                               |
| skor_kesehatan    | VARCHAR(50)  |                                   |
| status            | ENUM         | newborn / growing / ready_for_sale / sold |
| foto_url          | VARCHAR(500) | Nullable                           |
| catatan           | TEXT         | Nullable                           |

**IncubatorSettings** (1 baris global)
| Kolom                  | Tipe         | Keterangan                    |
|------------------------|--------------|-------------------------------|
| id                     | INT          | Primary key (selalu 1)        |
| suhu_min               | NUMERIC(4,2) | Default 37.0°C                |
| suhu_max               | NUMERIC(4,2) | Default 38.0°C                |
| kelembapan_min         | NUMERIC(4,2) | Default 55.0%                 |
| kelembapan_max         | NUMERIC(4,2) | Default 65.0%                 |
| interval_rotasi_menit  | INT          | Default 240 (4 jam)           |
| updated_by             | VARCHAR(50)  | FK -> Users.id                |
| updated_at             | DATETIME     |                               |

**IncubatorStatus** (real-time)
| Kolom             | Tipe         | Keterangan                    |
|-------------------|--------------|-------------------------------|
| id                | INT (auto)   | Primary key                   |
| suhu_sekarang     | NUMERIC(5,2) | Suhu saat ini (°C)            |
| kelembapan_sekarang| NUMERIC(5,2)| Kelembapan saat ini (%)       |
| lampu_status      | ENUM         | ON / OFF                      |
| terakhir_rotasi   | DATETIME     | Nullable                      |
| updated_at        | DATETIME     |                               |

**TelemetryLogs**
| Kolom       | Tipe         | Keterangan                    |
|-------------|--------------|-------------------------------|
| id          | INT (auto)   | Primary key                   |
| timestamp   | VARCHAR(50)  | Waktu pencatatan              |
| temperature | NUMERIC(5,2) | Suhu (°C)                     |
| humidity    | NUMERIC(5,2) | Kelembapan (%)                |

**RotationLogs**
| Kolom       | Tipe         | Keterangan                    |
|-------------|--------------|-------------------------------|
| id          | INT (auto)   | Primary key                   |
| timestamp   | VARCHAR(50)  | Waktu                         |
| status      | ENUM         | sukses / gagal                |
| catatan     | TEXT         | Nullable                      |

**Sales**
| Kolom       | Tipe           | Keterangan                    |
|-------------|----------------|-------------------------------|
| id          | VARCHAR(50)    | Primary key (SLS-xxx)         |
| tanggal     | VARCHAR(50)    | ISO date                      |
| item        | VARCHAR(255)   | Nama barang                   |
| referensiId | VARCHAR(100)   | ID telur/chick terkait        |
| pembeli     | VARCHAR(255)   | Nama pembeli                  |
| qty         | INT            | Jumlah                        |
| hargaSatuan | NUMERIC(12,2)  | Harga satuan                  |
| status      | VARCHAR(50)    | Booking / DP / Lunas          |
| catatan     | TEXT           | Nullable                      |

**FinanceEntries**
| Kolom       | Tipe           | Keterangan                    |
|-------------|----------------|-------------------------------|
| id          | VARCHAR(50)    | Primary key (FIN-xxx)         |
| tanggal     | VARCHAR(50)    | ISO date                      |
| tipe        | ENUM           | Pemasukan / Pengeluaran       |
| kategori    | VARCHAR(255)   | Pakan, Penjualan, Listrik, dll|
| jumlah      | NUMERIC(12,2)  | Nominal                       |
| catatan     | TEXT           | Nullable                      |
| created_by  | VARCHAR(50)    | FK -> Users.id                |

**Alerts**
| Kolom       | Tipe         | Keterangan                    |
|-------------|--------------|-------------------------------|
| id          | INT (auto)   | Primary key                   |
| tipe        | ENUM         | suhu / kelembapan / rotasi_gagal / lain |
| pesan       | VARCHAR(500) | Deskripsi alert               |
| level       | ENUM         | info / warning / critical     |
| is_read     | BOOLEAN      | Default false                 |
| created_at  | DATETIME     |                               |

## Environment Variables

### fastapi-backend/.env

| Variable                | Default                          | Keterangan                     |
|-------------------------|----------------------------------|--------------------------------|
| `DATABASE_URL`          | `sqlite:///...`                  | URL database (MySQL via compose)|
| `API_KEY_WEB`           | `dev-api-key-web`                | API Key untuk web client       |
| `API_KEY_ANDROID`       | `dev-api-key-android`            | API Key untuk Android client   |
| `JWT_SECRET`            | `dev-secret-ganti-di-produksi`   | Secret key untuk JWT           |
| `CORS_ORIGINS`          | `https://merak.ndalemkerto.com`  | Origin yang diizinkan (CORS)   |
| `FIRST_ADMIN_EMAIL`     | `admin@kampungmerak.id`          | Email admin seed pertama       |
| `FIRST_ADMIN_PASSWORD`  | `admin123`                       | Password admin seed pertama    |

### server/.env

| Variable                | Default                                         | Keterangan               |
|-------------------------|-------------------------------------------------|--------------------------|
| `INCUBATOR_RTSP_URL`    | `rtsp://admin:Admin123@192.168.110.227:554/...` | URL kamera inkubator     |
| `KANDANG_RTSP_URL`      | `rtsp://admin:Admin123@192.168.110.227:554/...` | URL kamera kandang       |

## Contoh Seed Data

Setelah server jalan, gunakan X-API-Key yang terdaftar di `.env`:

```bash
API_KEY="dev-api-key-web"
BASE="http://localhost:8000"
TOKEN="<login dulu untuk dapat token>"

# 1. Login admin (user USR-001 dibuat otomatis saat startup)
TOKEN=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST -d '{"email":"admin@kampungmerak.id","password":"admin123"}' \
  "$BASE/auth/login" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Tambah indukan
curl -H "X-API-Key: $API_KEY" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST -d '{"id":"MRK-F0-001","jenis_kelamin":"jantan","generasi":"F0","varian_warna":"Hijau","asal":"beli"}' \
  "$BASE/api/breeders"

# 3. Tambah telur
curl -H "X-API-Key: $API_KEY" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST -d '{"id":"EGG-APR25-001","slot":1,"induk_jantan_id":"MRK-F0-001","induk_betina_id":"MRK-F0-001","tanggalMasuk":"2026-04-01","fertilitas":"Fertil"}' \
  "$BASE/api/eggs"

# 4. Tambah anakan (auto-inherit induk dari telur)
curl -H "X-API-Key: $API_KEY" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST -d '{"id":"CHK-001","egg_id":"EGG-APR25-001","tanggal_menetas":"2026-07-17","berat_awal":85.5,"skor_kesehatan":"baik"}' \
  "$BASE/api/chicks"

# 5. Kirim data inkubator dari device (tanpa JWT, cukup X-API-Key)
curl -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST -d '{"suhu_sekarang":37.5,"kelembapan_sekarang":60.0,"lampu_status":"ON"}' \
  "$BASE/api/incubator/status"

# 6. Cek dashboard
curl -H "X-API-Key: $API_KEY" -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/dashboard/summary"
```
# backend-merak
