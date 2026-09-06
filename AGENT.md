# AGENT.md — Kampung Merak / PavoPrecise RESTful API

Panduan ini digunakan oleh AI coding agent (Claude Code) untuk membangun dan mengembangkan RESTful API sistem manajemen ternak merak. Dokumen ini adalah sumber kebenaran tunggal (single source of truth) untuk struktur data, aturan akses, dan endpoint yang harus dibuat.

---

## 1. Tech Stack (existing, jangan diganti)

- **Backend**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Database**: MySQL (via Docker Compose) / SQLite (lokal, fallback jika `MYSQL_HOST` tidak di-set)
- **Validation**: Pydantic (schemas.py)
- **Auth**: JWT (python-jose) + bcrypt (passlib)
- **Struktur folder existing**:
  ```
  fastapi-backend/
    app/
      main.py       # entrypoint & endpoints
      database.py   # koneksi database
      models.py     # SQLAlchemy models
      schemas.py    # Pydantic schemas
      auth.py       # (baru) logic JWT & role checker
  ```

## 2. Prinsip Umum

- **Semua endpoint (termasuk yang "publik/tanpa login") wajib menyertakan API Key** lewat header `X-API-Key`. Tanpa API Key valid, request ditolak `401` sebelum masuk ke logic apapun. Ini gerbang pertama, terpisah dari JWT.
- **Hanya Pemilik dan Staff yang butuh login (JWT).** Viewer TIDAK punya akun, TIDAK login — akses viewer = akses publik (endpoint GET tanpa token JWT, tapi tetap wajib API Key).
- Endpoint GET untuk data operasional (Breeder, Egg, Chick, Incubator Settings/Status/Log, Sales) **tidak butuh JWT** — cukup API Key valid, siapa saja dengan key resmi bisa akses.
- Endpoint GET untuk data sensitif (Dashboard Summary, Notifikasi/Alerts, Finance, User Management) **wajib API Key + JWT**, hanya bisa diakses `pemilik` atau `staff` (Finance & User Management: `pemilik` saja).
- Setiap endpoint yang mengubah data (POST/PUT/DELETE) **selalu wajib API Key + JWT** dan dicek role-nya lewat `require_role(...)` — tidak ada modul yang bisa diubah tanpa login.
- Semua ID entity pakai format prefix + nomor urut (contoh: `MRK-F0-001`, `EGG-001`, `CHK-001`, `SLS-001`, `FIN-001`, `USR-001`). Prefix disesuaikan per module.
- Field tanggal disimpan sebagai string ISO (`YYYY-MM-DD` atau `YYYY-MM-DD HH:MM:SS`), konsisten dengan schema existing.
- Response error pakai HTTP status standar: `401` (belum login), `403` (role tidak punya izin), `404` (data tidak ditemukan), `422` (validasi gagal).

---

## 3. Role & Permission Matrix

| Role | Deskripsi | Butuh Login? |
|---|---|---|
| `pemilik` | Owner. Akses penuh ke semua modul, termasuk Finance & User Management. | Ya |
| `staff` | Petugas harian. Bisa kelola data operasional (indukan, telur, anakan, inkubator), bisa lihat Sales. Tidak bisa akses Finance. | Ya |
| `viewer` | **Bukan role akun** — ini adalah publik/tanpa login. Siapa saja yang buka endpoint GET data operasional otomatis dapat perlakuan "viewer" (read-only, tanpa token). | Tidak |

| Modul | Pemilik | Staff | Publik (Viewer, tanpa login) |
|---|---|---|---|
| Indukan (Breeder) | CRUD | CRUD | View (GET saja, publik) |
| Egg | CRUD | CRUD | View (GET saja, publik) |
| Hatchery (Anak Merak) | CRUD | CRUD | View (GET saja, publik) |
| Incubator Settings | CRUD | CRUD | View (GET saja, publik) |
| Incubator Status/Log | View | View | View (GET saja, publik) |
| Sales | CRUD | CRUD | View (GET saja, publik) |
| Finance (Pemasukan/Pengeluaran) | CRUD | ❌ No access | ❌ No access (butuh login pemilik) |
| Dashboard/Summary | View | View | ❌ No access (butuh login) |
| Notifikasi/Alerts | View, Delete | View | ❌ No access (butuh login) |
| User Management | CRUD | ❌ | ❌ No access (butuh login) |

---

## 4. Data Model

### 4.1 User (Auth)
```
User
- id: str (PK, "USR-001")
- email: str (unique)
- hashed_password: str
- nama: str
- role: enum(pemilik, staff, viewer)
- created_at: datetime
```

### 4.2 Breeder (Indukan)
```
Breeder
- id: str (PK, "MRK-F0-001")
- nama: str (opsional, boleh kosong)
- jenis_kelamin: enum(jantan, betina)
- tanggal_lahir: date (nullable)
- generasi: str  # F0, F1, F2, F3, dst
- varian_warna: str  # default: Hijau, Biru, Putih — field bebas (extensible, bukan enum tertutup)
- asal: enum(beli, ternak_sendiri)
- status: enum(breeding, resting, ready_for_sale)
- foto_url: str (nullable)
- parent_jantan_id: str (FK -> Breeder.id, nullable)  # null jika F0
- parent_betina_id: str (FK -> Breeder.id, nullable)  # null jika F0
- created_at: datetime
```

**Catatan performa produksi** (dihitung otomatis, bukan kolom tersimpan — dihasilkan lewat query/agregasi saat endpoint comparison dipanggil):
- Jumlah telur dihasilkan per periode (dari tabel Egg, filter induk_jantan_id / induk_betina_id)
- Persentase telur fertil (fertil vs infertil, dari Egg.fertilitas)
- Jumlah anakan hidup (dari tabel Chick yang link ke induk ini)

### 4.3 Egg (Telur) — update dari schema existing
```
Egg
- id: str (PK, "EGG-001")
- slot: int (unique, 1-100 — posisi fisik di inkubator)
- induk_jantan_id: str (FK -> Breeder.id, required)
- induk_betina_id: str (FK -> Breeder.id, required)
- tanggalMasuk: str (ISO date)
- fertilitas: enum(Fertil, Infertil, Belum dicek)
- akhir: enum(Menetas, Gagal, Proses)
- catatan: text (nullable)
```

### 4.4 Chick (Anak Merak) — baru
```
Chick
- id: str (PK, "CHK-001")
- egg_id: str (FK -> Egg.id)  # asal telur, otomatis warisi induk_jantan_id/induk_betina_id dari sini
- tanggal_menetas: date
- berat_awal: numeric(6,2)  # gram
- skor_kesehatan: str  # atau numeric, sesuaikan skala yang dipakai
- status: enum(newborn, growing, ready_for_sale, sold)
- foto_url: str (nullable)
- catatan: text (nullable)
```

### 4.5 Incubator — 3 lapis data

**a. IncubatorSettings** (1 baris, global — 1 unit fisik)
```
IncubatorSettings
- id: int (PK, selalu 1 baris untuk MVP)
- suhu_min: numeric(4,2)      # default 37.0
- suhu_max: numeric(4,2)      # default 38.0
- kelembapan_min: numeric(4,2) # default 55.0
- kelembapan_max: numeric(4,2) # default 65.0
- interval_rotasi_menit: int   # default 240 (4 jam)
- updated_by: str (FK -> User.id)
- updated_at: datetime
```

**b. IncubatorStatus** (status real-time terbaru, dikirim device via MQTT/API)
```
IncubatorStatus
- id: int (PK)
- suhu_sekarang: numeric(5,2)
- kelembapan_sekarang: numeric(5,2)
- lampu_status: enum(ON, OFF)   # otomatis, ditentukan device berdasarkan threshold
- updated_at: datetime
```

### 4.6 Sales (existing, tidak berubah)
```
Sales
- id, tanggal, item, referensiId, pembeli, qty, hargaSatuan, status, catatan
```

### 4.7 FinanceEntry (baru)
```
FinanceEntry
- id: str (PK, "FIN-001")
- tanggal: str
- tipe: enum(Pemasukan, Pengeluaran)
- kategori: str  # e.g. "Pakan", "Penjualan", "Listrik", "Obat"
- jumlah: numeric(12,2)
- catatan: text (nullable)
- created_by: str (FK -> User.id)
```

### 4.8 Alert/Notification (baru)
```
Alert
- id: int (auto PK)
- tipe: enum(suhu, kelembapan, lain)
- pesan: str
- level: enum(info, warning, critical)
- is_read: bool (default False)
- created_at: datetime
```
Dibuat otomatis oleh sistem saat data telemetry masuk dan nilainya keluar dari `IncubatorSettings` (suhu_min/max, kelembapan_min/max).

---

## 5. Endpoint List

### Auth
| Method | Endpoint | Role |
|---|---|---|
| POST | `/auth/register` | pemilik only (bikin user baru) |
| POST | `/auth/login` | public |
| GET | `/auth/me` | logged in |

### Breeder
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/breeders` | **publik, tanpa login** |
| GET | `/api/breeders/{id}` | **publik, tanpa login** |
| POST | `/api/breeders` | pemilik, staff (login wajib) |
| PUT | `/api/breeders/{id}` | pemilik, staff (login wajib) |
| DELETE | `/api/breeders/{id}` | pemilik (login wajib) |
| GET | `/api/breeders/{id}/lineage` | **publik, tanpa login** — tampilkan pohon silsilah (recursive dari parent_jantan_id/parent_betina_id) |
| GET | `/api/breeders/compare?ids=A,B` | **publik, tanpa login** — comparison sederhana, tampilkan metrik performa side-by-side |

### Egg
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/eggs` | **publik, tanpa login** |
| POST | `/api/eggs` | pemilik, staff (login wajib) |
| PUT | `/api/eggs/{id}` | pemilik, staff (login wajib) |
| DELETE | `/api/eggs/{id}` | pemilik (login wajib) |

### Chick (Hatchery)
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/chicks` | **publik, tanpa login** |
| POST | `/api/chicks` | pemilik, staff (login wajib) |
| PUT | `/api/chicks/{id}` | pemilik, staff (login wajib) |
| DELETE | `/api/chicks/{id}` | pemilik (login wajib) |

### Incubator
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/incubator/settings` | **publik, tanpa login** |
| PUT | `/api/incubator/settings` | pemilik, staff (login wajib) |
| GET | `/api/incubator/status` | **publik, tanpa login** |
| POST | `/api/incubator/status` | device/internal (IoT gateway push data, pakai API key khusus device, bukan JWT user) |

### Sales
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/sales` | **publik, tanpa login** |
| POST | `/api/sales` | pemilik, staff (login wajib) |
| PUT | `/api/sales/{id}` | pemilik, staff (login wajib) |
| DELETE | `/api/sales/{id}` | pemilik (login wajib) |

### Finance
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/finance` | pemilik only |
| POST | `/api/finance` | pemilik only |
| PUT | `/api/finance/{id}` | pemilik only |
| DELETE | `/api/finance/{id}` | pemilik only |

### Dashboard
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/dashboard/summary` | **wajib login** — pemilik, staff. Ringkasan: total telur aktif, total anakan bulan ini, status inkubator terkini, total pemasukan/pengeluaran bulan ini (field `finance_summary` cuma muncul untuk role `pemilik`) |

### Notifikasi
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/alerts` | **wajib login** — pemilik, staff |
| PUT | `/api/alerts/{id}/read` | **wajib login** — pemilik, staff |
| DELETE | `/api/alerts/{id}` | **wajib login** — pemilik |

### User Management
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/users` | pemilik |
| PUT | `/api/users/{id}` | pemilik |
| DELETE | `/api/users/{id}` | pemilik |

---

## 6. Business Logic Notes untuk Agent

1. **Auto-alert**: setiap kali `POST /api/incubator/status` diterima, cek apakah `suhu_sekarang` / `kelembapan_sekarang` keluar dari range `IncubatorSettings`. Jika ya, buat record baru di tabel `Alert`.
2. **Breeder performance**: jangan simpan sebagai kolom statis, hitung on-the-fly via query saat endpoint `/api/breeders/compare` atau `/api/breeders/{id}` dipanggil (join ke Egg dan Chick).
3. **Dashboard summary**: response harus beda tergantung role — field `finance_summary` hanya muncul kalau requester adalah `pemilik`.
4. **Chick auto-link**: saat create Chick, ambil `induk_jantan_id` dan `induk_betina_id` dari Egg terkait (via `egg_id`), simpan sebagai reference (bukan duplikasi wajib, tapi bisa di-denormalisasi untuk query cepat — keputusan teknis di tangan agent).
5. **Dashboard & data lain**: manual refresh saja, TIDAK perlu WebSocket.
6. **Notifikasi**: TIDAK perlu push server (Firebase/OneSignal). Cukup simpan di DB, mobile app polling endpoint `/api/alerts` sendiri.

---

## 8. Client Security Layer

Ini bukan pengganti auth (JWT), tapi lapisan tambahan di depan semua request, tujuannya mempersulit akses dari luar app resmi.

### 8.1 API Key per Platform (wajib)
- Buat 2 API Key berbeda: `API_KEY_WEB` dan `API_KEY_ANDROID`, disimpan di `.env` server.
- Setiap request wajib kirim header `X-API-Key`. Middleware cek key ini **sebelum** request masuk ke endpoint manapun (termasuk yang publik/no-JWT).
- Key ditanam di sisi client (web build config / Android BuildConfig), **jangan pernah** commit ke Git repo publik.
- Catatan realistis: ini menyaring bot/orang iseng, TAPI bukan proteksi mutlak (key di client bisa diekstrak). Karena itu perlu lapisan tambahan di bawah ini.

### 8.2 Android — Play Integrity API (rekomendasi kuat)
- Setiap request penting dari app Android menyertakan token integrity dari Google Play Integrity API.
- Server verifikasi token ini ke Google, memastikan request datang dari APK asli yang terinstall resmi via Play Store (bukan APK modifikasi/reverse-engineered/emulator tidak dikenal).
- Setup butuh: project terdaftar di Google Play Console (app harus sudah publish, minimal ke internal testing track).
- **Catatan**: ini improvement lanjutan, bukan syarat untuk MVP pertama. Bisa ditambahkan setelah app Android sudah masuk tahap rilis.

### 8.3 Web — CORS Restriction (wajib)
- Server hanya izinkan request `Origin` dari domain resmi (misal `https://kampungmerak.id`, dan domain staging kalau ada).
- Ini mencegah domain lain manggil API langsung dari browser pengguna lain lewat JavaScript.
- **Batasan**: tidak menghalangi request manual via Postman/curl dengan API Key yang sama — CORS hanya berlaku di level browser.

### 8.4 Rate Limiting (wajib, jaring pengaman terakhir)
- Batasi jumlah request per API Key / per IP dalam periode waktu tertentu (contoh awal: 60 request/menit per key, sesuaikan nanti sesuai kebutuhan real).
- Kalau limit terlampaui, response `429 Too Many Requests`.
- Terapkan library rate limiting FastAPI (misal `slowapi`) di level middleware, bukan per-endpoint manual.

### Urutan Middleware (dari luar ke dalam)
```
Request masuk
   → Cek Rate Limit (per IP/key)
   → Cek CORS Origin (khusus request dari browser)
   → Cek X-API-Key (wajib untuk semua endpoint)
   → Cek Play Integrity token (khusus endpoint sensitif dari Android, opsional/lanjutan)
   → Cek JWT + Role (khusus endpoint yang butuh login)
   → Endpoint logic
```

---

## 9. Belum Termasuk MVP (skip dulu)

- Certificate of Authenticity / QR / blockchain
- Multi-incubator support (saat ini asumsi 1 unit fisik)
- Inbreeding warning di breeder comparison
- Push notification server-side (FCM/OneSignal)
- Play Integrity API — ditambahkan setelah app Android rilis ke Play Store (lihat section 8.2)