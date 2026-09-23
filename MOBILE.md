# MOBILE.md — PavoPrecise / Kampung Merak (Flutter Mobile App)

> Dokumen ini adalah *single source of truth* untuk pengembangan aplikasi mobile Flutter.
> **Backend API**: FastAPI di `fastapi-backend/` — lihat `README.md` dan `AGENT.md` untuk kontrak endpoint.
> **Base URL produksi**: `https://api-merak.abdulrosyid.my.id` (lihat `.env` → `VITE_API_BASE_URL`, `vite.config.js` proxy `/api`+`/auth`, `nginx.conf` `proxy_pass`).
> **CCTV**: Flask OpenCV MJPEG gateway `server/rtsp_gateway_example.py` di port `5000`, diproxy Nginx sebagai `/video_feed`, `/kandang_feed`, `/cctv_health` — JANGAN akses `http://BASE:5000` langsung dari app rilis (mixed-content + tidak lewat HTTPS).
> **Realtime sensor**: MQTT HiveMQ Cloud via WebSocket (ESP32 SHT31) — config diambil dari `GET /api/incubator/settings`.

---

## 1. Tech Stack

| Layer | Pilihan |
|-------|---------|
| Framework | Flutter (Dart) |
| State Management | **Riverpod** (`flutter_riverpod`) |
| HTTP Client | **Dio** (`dio`) |
| Routing | **GoRouter** (`go_router`) |
| Charts | **fl_chart** (line chart suhu & kelembapan; sumber: MQTT trend buffer + fallback `GET /api/telemetry`) |
| Realtime sensor | **mqtt_client** (`mqtt_client`, MQTT over WebSocket `wss://...:8884/mqtt`) |
| CCTV player | **MJPEG stream** — package `mjpeg` / `flutter_mjpeg` (multipart `x-mixed-replace`), JANGAN pakai `NetworkImage`/`Image.network` saja (hanya 1 frame) |
| Image cache | `cached_network_image` (foto breeder/chick) |
| Secure Storage | **flutter_secure_storage** (JWT + API Key + kredensial MQTT) |
| Pull-to-Refresh | `RefreshIndicator` built-in |
| Build | APK / App Bundle via `flutter build` |

> Catatan backend (penting): `fastapi-backend/app/main.py` yang **saat ini ter-mount** hanya melayani
> `GET/POST /api/eggs`, `GET/POST/PUT/DELETE /api/sales`, `GET/POST /api/telemetry`,
> dan `GET /api/incubator/settings` (yang sebenarnya mengembalikan **konfigurasi MQTT**, bukan threshold inkubator).
> Kontrak lengkap (breeders, chicks, incubator status/settings DB, dashboard, alerts, finance, users, auth)
> didefinisikan di `fastapi-backend/app/routers/*.py` sesuai `AGENT.md`, **tetapi belum di-`include_router()` di `main.py`**.
> Flutter WAJIB coding terhadap kontrak `AGENT.md` + tabel §7.3, dan tahan terhadap `404` selama masa transisi
> (fallback: tampilkan empty-state, jangan crash — contoh: `dashboard_summary` backend me-return default nol saat error).

---

## 2. Autentikasi & Keamanan

- **API Key global (wajib di SEMUA request, termasuk yang publik)**: header `X-API-Key`.
  - Web memakai `VITE_API_KEY_WEB`, **Android wajib pakai key sendiri** (`API_KEY_ANDROID`, via `--dart-define`, disimpan di `flutter_secure_storage`, bisa diganti di Profile/Settings).
  - Sesuai `AGENT.md` §8, middleware server mengecek `X-API-Key` **sebelum** logic endpoint (rate-limit → CORS → API Key → JWT → logic).
  - Realita hari ini: `main.py`/`routers` belum menegakkan cek ini — Flutter **tetap harus mengirimnya** agar siap saat enforcement diaktifkan.
- **JWT**: `POST /auth/login` dengan `{email, password}` → `{access_token, token_type: "bearer", user: {...}}`.
  - Algoritma `HS256`, expiry **24 jam** (`ACCESS_TOKEN_EXPIRE_MINUTES = 60*24` di `fastapi-backend/app/auth.py`, secret dari `JWT_SECRET`).
  - Dikirim via `Authorization: Bearer <token>` untuk endpoint yang butuh login. Disimpan di `flutter_secure_storage` (`jwt_token`).
  - `GET /auth/me` butuh role `pemilik`/`staff`. `POST /auth/register` **hanya `pemilik`** (butuh JWT pemilik).
- **Role**: `pemilik` (penuh, termasuk Finance & Users), `staff` (operasional, tanpa Finance/Users), `viewer` = **bukan akun** — publik tanpa login, hanya `GET` operasional + `X-API-Key`.
- **Logout**: hapus `jwt_token` dari secure storage, redirect ke `/login`. Interceptor Dio: `401` → `forceLogout()`.
- **API Key default**: di-bundle via `--dart-define=API_KEY_ANDROID=xxx` untuk instalasi pertama — user bisa ganti di settings. Jangan hardcode key produksi di source.

---

## 3. Struktur Folder Flutter

```
pavoprecise_app/
├── lib/
│   ├── main.dart
│   ├── app.dart                          # MaterialApp + GoRouter
│   │
│   ├── core/
│   │   ├── constants.dart                # base URL, enum mapping, MQTT topics, CCTV paths
│   │   ├── config.dart                   # baca --dart-define (BASE_URL, API keys, MQTT, CCTV)
│   │   ├── theme.dart                    # Tema warna (hijau/emas — branding merak)
│   │   └── utils/
│   │       ├── date_formatter.dart
│   │       ├── number_formatter.dart
│   │       └── validators.dart
│   │
│   ├── data/
│   │   ├── models/                       # Dart model classes (dari API)
│   │   │   ├── user.dart
│   │   │   ├── breeder.dart
│   │   │   ├── egg.dart
│   │   │   ├── chick.dart
│   │   │   ├── incubator_settings.dart   # threshold DB (kontrak routers/incubator.py)
│   │   │   ├── incubator_status.dart
│   │   │   ├── mqtt_config.dart          # {mqtt_url, mqtt_username, mqtt_password, status} dari GET /api/incubator/settings (live)
│   │   │   ├── telemetry_log.dart        # {id, timestamp, temperature, humidity} dari /api/telemetry (live)
│   │   │   ├── sale.dart
│   │   │   ├── finance_entry.dart
│   │   │   ├── alert.dart
│   │   │   └── dashboard_summary.dart
│   │   │
│   │   ├── providers/                    # Riverpod providers
│   │   │   ├── api_client_provider.dart  # Dio instance
│   │   │   ├── auth_provider.dart        # login/logout/token
│   │   │   ├── dashboard_provider.dart
│   │   │   ├── breeders_provider.dart
│   │   │   ├── eggs_provider.dart
│   │   │   ├── chicks_provider.dart
│   │   │   ├── incubator_provider.dart   # settings/threshold + status DB
│   │   │   ├── mqtt_provider.dart        # koneksi MQTT + telemetry realtime + trend buffer
│   │   │   ├── telemetry_provider.dart   # fallback REST GET /api/telemetry (100 terakhir)
│   │   │   ├── cctv_provider.dart        # health polling /cctv_health + selected feed
│   │   │   ├── sales_provider.dart
│   │   │   ├── finance_provider.dart
│   │   │   ├── alerts_provider.dart
│   │   │   └── users_provider.dart
│   │   │
│   │   ├── services/
│   │   │   ├── mqtt_service.dart         # wrapper mqtt_client (connect/subscribe/publish, auto-reconnect)
│   │   │   └── cctv_service.dart         # helper URL feed + fetch /cctv_health
│   │   │
│   │   └── repositories/                 # (opsional) layer repository
│   │       └── auth_repository.dart
│   │
│   ├── features/                         # Setiap fitur = 1 folder
│   │   ├── splash/
│   │   │   └── splash_screen.dart
│   │   │
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── widgets/
│   │   │       └── login_form.dart
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── incubator_status_card.dart
│   │   │       ├── stats_card.dart       # total telur, anakan
│   │   │       └── finance_summary_card.dart
│   │   │
│   │   ├── incubator/
│   │   │   ├── incubator_screen.dart     # TabBar: Status | Grafik | Rotasi
│   │   │   ├── settings_screen.dart      # Edit threshold
│   │   │   └── widgets/
│   │   │       ├── status_widget.dart    # gabung MQTT realtime + GET /api/incubator/status
│   │   │       ├── telemetry_chart.dart  # fl_chart dari trend buffer (24 titik)
│   │   │       ├── settings_form.dart
│   │   │
│   │   ├── breeders/
│   │   │   ├── breeders_list_screen.dart
│   │   │   ├── breeder_detail_screen.dart
│   │   │   ├── breeder_form_screen.dart   # Create + Edit
│   │   │   ├── breeder_lineage_screen.dart
│   │   │   ├── breeder_compare_screen.dart
│   │   │   └── widgets/
│   │   │       ├── breeder_card.dart
│   │   │       ├── lineage_tree.dart
│   │   │       └── compare_card.dart
│   │   │
│   │   ├── eggs/
│   │   │   ├── eggs_list_screen.dart
│   │   │   ├── egg_detail_screen.dart
│   │   │   ├── egg_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── egg_card.dart
│   │   │
│   │   ├── chicks/
│   │   │   ├── chicks_list_screen.dart
│   │   │   ├── chick_detail_screen.dart
│   │   │   ├── chick_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── chick_card.dart
│   │   │
│   │   ├── sales/
│   │   │   ├── sales_list_screen.dart
│   │   │   ├── sale_detail_screen.dart
│   │   │   ├── sale_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── sale_card.dart
│   │   │
│   │   ├── finance/                      # Hanya untuk role pemilik
│   │   │   ├── finance_list_screen.dart
│   │   │   ├── finance_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── finance_entry_card.dart
│   │   │
│   │   ├── alerts/
│   │   │   ├── alerts_list_screen.dart
│   │   │   └── widgets/
│   │   │       └── alert_tile.dart
│   │   │
│   │   ├── users/                        # Hanya untuk role pemilik
│   │   │   ├── users_list_screen.dart
│   │   │   ├── user_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── user_tile.dart
│   │   │
│   │   ├── cctv/
│   │   │   ├── cctv_screen.dart          # 2 feed MJPEG + health polling + reload
│   │   │   └── widgets/
│   │   │       ├── mjpeg_view.dart       # pembungkus package mjpeg/flutter_mjpeg
│   │   │       ├── cctv_status_badge.dart # LIVE / MENYAMBUNG / OFFLINE
│   │   │       └── cctv_error_view.dart  # overlay error + tombol Hubungkan Ulang
│   │   │
│   │   └── profile/
│   │       ├── profile_screen.dart
│   │       └── widgets/
│   │           └── api_key_settings.dart
│   │
│   └── shared/                           # Widget reusable
│       ├── app_drawer.dart               # Navigation drawer
│       ├── app_bottom_nav.dart            # Bottom nav bar
│       ├── loading_widget.dart
│       ├── error_widget.dart
│       └── confirm_dialog.dart
│
├── test/
│   ├── data/
│   │   └── models/                       # Unit test model
│   └── features/                         # Widget test per fitur
│
├── pubspec.yaml
└── README.md
```

---

## 4. Data Models (Dart) — Lengkap

Setiap model memiliki: **fromJson**, **toJson**, **copyWith**.

### 4.1 User

```dart
class User {
  final String id;           // "USR-001"
  final String email;
  final String nama;
  final String role;         // "pemilik" | "staff"
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    required this.nama,
    required this.role,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  User copyWith({...});
}
```

### 4.2 Breeder

```dart
class Breeder {
  final String id;           // F0: "JB01" (jantan) / "BB01" (betina); anak: "JB01BB02-01"
  final String? nama;
  final String jenisKelamin; // "jantan" | "betina"
  final DateTime? tanggalLahir;
  final String generasi;     // "F0", "F1", ...
  final String varianWarna;  // "Hijau", "Biru", "Putih"
  final String asal;         // "beli" | "ternak_sendiri"
  final String status;       // "breeding" | "resting" | "ready_for_sale"
  final String? fotoUrl;
  final String? parentJantanId;
  final String? parentBetinaId;
  final DateTime? createdAt;

  // Field tambahan dari detail endpoint
  final int totalTelur;
  final double persentaseFertil;
  final int jumlahAnakan;

  Breeder({...});
  factory Breeder.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Breeder copyWith({...});
}
```

> **Kontrak ID silsilah:** `id` opsional saat POST — kosongkan agar server generate (`JB01`/`BB01` untuk F0, `{Jantan}{Betina}-{NN}` untuk anak). Saat PUT, `jenisKelamin`/`parentJantanId`/`parentBetinaId` tidak boleh berubah (prefix terkunci; beda prefix → `422`, sudah punya turunan → `400`).

### 4.3 Egg

```dart
class Egg {
  final String id;           // "{indukJantan}{indukBetina}-{nomor}", contoh "JB01BB02-01"
  final int slot;            // 1-100
  final String indukJantanId;
  final String indukBetinaId;
  final String tanggalMasuk; // "2026-04-01"
  final String fertilitas;   // "Fertil" | "Infertil" | "Belum dicek"
  final String akhir;        // "Menetas" | "Gagal" | "Proses"
  final String? catatan;

  Egg({...});
  factory Egg.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Egg copyWith({...});
}
```

> ⚠️ Diskrepansi live: `GET /api/eggs` di `main.py` hari ini mengembalikan kolom
> `{id, slot, tanggalMasuk, fertilitas, akhir, catatan}` (tanpa `induk_jantan/betina_id` — lihat `schemas.py`/`models.py`).
> Model Flutter tetap pakai kontrak `AGENT.md` (dengan induk IDs), tapi `fromJson` harus toleran null
> untuk `indukJantanId`/`indukBetinaId` sampai backend dimigrasi ke `routers/eggs.py`.

### 4.4 Chick

```dart
class Chick {
  final String id;           // "{eggId}-C{nomor}", contoh "JB01BB02-01-C01"
  final String eggId;
  final String? indukJantanId;  // auto-isi server dari egg (read-only)
  final String? indukBetinaId;  // auto-isi server dari egg (read-only)
  final String tanggalMenetas;  // "2026-07-17"
  final double beratAwal;       // gram
  final String skorKesehatan;
  final String status;       // "newborn" | "growing" | "ready_for_sale" | "sold"
  final String? fotoUrl;
  final String? catatan;

  Chick({...});
  factory Chick.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Chick copyWith({...});
}
```

> **Kontrak ID silsilah:** `id` opsional saat POST (kosong = server generate `{eggId}-C{NN}`). `eggId` terkunci saat update. Rename hanya `-C{NN}`; ganti egg → `422`.

### 4.5 IncubatorSettings

> **Kontrak aktual (superset):** `GET /api/incubator/settings` mengembalikan kredensial MQTT (`mqtt_url`, `mqtt_username`, `mqtt_password`, `status`) **plus** threshold (`suhu_min/max`, `kelembapan_min/max`, `interval_rotasi_menit`). `PUT` menerima field threshold saja. Sesuaikan model di bawah dengan menambahkan field MQTT opsional.

```dart
class IncubatorSettings {
  final int id;                    // always 1
  final double suhuMin;            // default 37.0
  final double suhuMax;            // default 38.0
  final double kelembapanMin;      // default 55.0
  final double kelembapanMax;      // default 65.0
  final int intervalRotasiMenit;   // default 240
  final String? updatedBy;
  final DateTime? updatedAt;

  IncubatorSettings({...});
  factory IncubatorSettings.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  IncubatorSettings copyWith({...});
}
```

> ⚠️ Diskrepansi live: `GET /api/incubator/settings` di `main.py` hari ini **bukan** threshold di atas,
> melainkan konfigurasi MQTT: `{mqtt_url, mqtt_username, mqtt_password, status}` (lihat §7.4).
> Flutter harus parse keduanya: coba parse sebagai `MqttConfig` dulu; threshold DB mengikuti kontrak
> `routers/incubator.py` (`GET/PUT /api/incubator/settings` dengan `suhu_min/max`, `kelembapan_min/max`, `interval_rotasi_menit`)
> dan harus tahan `404 "Pengaturan inkubator belum diinisialisasi"`.

### 4.6 IncubatorStatus

```dart
class IncubatorStatus {
  final int id;
  final double suhuSekarang;
  final double kelembapanSekarang;
  final String lampuStatus;     // "ON" | "OFF"
  final DateTime? terakhirRotasi;
  final DateTime? updatedAt;

  IncubatorStatus({...});
  factory IncubatorStatus.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
}
```

Sumber live: `GET /api/incubator/status` (kontrak `routers/incubator.py`, pesan 404 `"Belum ada data status inkubator"` jika kosong)
+ realtime MQTT (§7.4). `POST /api/incubator/status` adalah **device/internal** (IoT gateway push, bukan JWT user).

### 4.7 Sale

```dart
class Sale {
  final String id;            // "SLS-001"
  final String tanggal;
  final String item;
  final String referensiId;
  final String pembeli;
  final int qty;
  final double hargaSatuan;
  final String status;        // "Booking" | "DP" | "Lunas"
  final String? catatan;

  Sale({...});
  factory Sale.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Sale copyWith({...});
}
```

### 4.10 FinanceEntry

```dart
class FinanceEntry {
  final String id;            // "FIN-001"
  final String tanggal;
  final String tipe;          // "Pemasukan" | "Pengeluaran"
  final String kategori;      // "Pakan", "Penjualan", "Listrik", "Obat"
  final double jumlah;
  final String? catatan;
  final String createdBy;

  FinanceEntry({...});
  factory FinanceEntry.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  FinanceEntry copyWith({...});
}
```

### 4.11 Alert

```dart
class Alert {
  final int id;
  final String tipe;          // "suhu" | "kelembapan" | "rotasi_gagal" | "lain"
  final bool isRead;
  final String pesan;
  final String level;         // "info" | "warning" | "critical"
  final DateTime? createdAt;

  Alert({...});
  factory Alert.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Alert copyWith({...});
}
```

Alert dibuat otomatis server setiap `POST /api/incubator/status` yang keluar range threshold
(suhu → `critical`, kelembapan → `warning`, lihat `routers/incubator.py::check_and_create_alerts`).
Sesuai `AGENT.md`: **tanpa push server (FCM/OneSignal)** — mobile polling `GET /api/alerts` sendiri.

### 4.12 DashboardSummary

```dart
class DashboardSummary {
  final int totalTelurAktif;
  final int totalAnakanBulanIni;
  final IncubatorStatus? inkubatorStatus;
  final FinanceSummary? financeSummary;   // hanya untuk pemilik

  DashboardSummary({...});
  factory DashboardSummary.fromJson(Map<String, dynamic> json);
}

class FinanceSummary {
  final double totalPemasukan;
  final double totalPengeluaran;
  final double saldo;

  FinanceSummary({...});
  factory FinanceSummary.fromJson(Map<String, dynamic> json);
}
```

`GET /api/dashboard/summary` **wajib login** (`pemilik`/`staff`); field `finance_summary` hanya muncul untuk `pemilik`.
Backend me-return default nol (bukan 500) saat error — Flutter tetap handle `inkubator_status: null`.

### 4.13 BreederCompareItem

```dart
class BreederCompareItem {
  final String id;
  final String? nama;
  final String jenisKelamin;
  final String generasi;
  final String varianWarna;
  final String status;
  final int totalTelur;
  final double persentaseFertil;
  final int jumlahAnakan;

  BreederCompareItem({...});
  factory BreederCompareItem.fromJson(Map<String, dynamic> json);
}
```

### 4.14 BreederLineage

```dart
class BreederLineage {
  final Breeder breeder;
  final Breeder? parentJantan;
  final Breeder? parentBetina;

  BreederLineage({...});
  factory BreederLineage.fromJson(Map<String, dynamic> json);
}
```

### 4.15 AuthResponse

```dart
class AuthResponse {
  final String accessToken;
  final String tokenType;    // "bearer"
  final User user;

  AuthResponse({...});
  factory AuthResponse.fromJson(Map<String, dynamic> json);
}
```

`POST /auth/login` → `TokenResponse{access_token, user}` (lihat `routers/auth.py`).

### 4.16 MqttConfig (live — dari `GET /api/incubator/settings` saat ini)

```dart
class MqttConfig {
  final String mqttUrl;       // "wss://....s1.eu.hivemq.cloud:8884/mqtt"
  final String? mqttUsername; // "endoqmerak"
  final String? mqttPassword; // disembunyikan di log/CCTV overlay
  final String status;        // "online"

  MqttConfig({...});
  factory MqttConfig.fromJson(Map<String, dynamic> json);
}
```

Diambil dulu dari API, fallback ke `--dart-define` / default `.env` web jika gagal (pola `useMqttBridge.js`).

### 4.17 TelemetryLog (live — `GET /api/telemetry`, 100 terbaru)

```dart
class TelemetryLog {
  final int id;
  final String timestamp;     // ISO string
  final double temperature;   // °C
  final double humidity;      // %

  TelemetryLog({...});
  factory TelemetryLog.fromJson(Map<String, dynamic> json);
}
```

Dipakai untuk grafik `fl_chart` saat MQTT belum terhubung / mode offline.

---

## 5. Navigation & Routing (GoRouter)

| Path | Screen | Auth Required |
|------|--------|---------------|
| `/` | Redirect ke `/dashboard` atau `/login` | — |
| `/login` | Login Screen | Tidak |
| `/dashboard` | Dashboard Screen | Ya |
| `/incubator` | Incubator Screen (Tabs) | Ya (read: publik) |
| `/incubator/settings` | Incubator Settings Form | Ya (pemilik/staff) |
| `/cctv` | CCTV Stream Screen (2 feed + health) | Ya |
| `/breeders` | Breeders List | Tidak (publik GET) |
| `/breeders/new` | Breeder Create Form | Ya |
| `/breeders/:id` | Breeder Detail | Tidak |
| `/breeders/:id/edit` | Breeder Edit Form | Ya |
| `/breeders/:id/lineage` | Lineage Tree | Tidak |
| `/breeders/compare` | Breeder Compare | Tidak |
| `/eggs` | Eggs List | Tidak |
| `/eggs/new` | Egg Create Form | Ya |
| `/eggs/:id` | Egg Detail | Tidak |
| `/eggs/:id/edit` | Egg Edit Form | Ya |
| `/chicks` | Chicks List | Tidak |
| `/chicks/new` | Chick Create Form | Ya |
| `/chicks/:id` | Chick Detail | Tidak |
| `/chicks/:id/edit` | Chick Edit Form | Ya |
| `/sales` | Sales List | Tidak |
| `/sales/new` | Sale Create Form | Ya |
| `/sales/:id` | Sale Detail | Tidak |
| `/sales/:id/edit` | Sale Edit Form | Ya |
| `/finance` | Finance List | Ya (pemilik only) |
| `/finance/new` | Finance Create Form | Ya (pemilik only) |
| `/alerts` | Alerts List | Ya |
| `/users` | Users List | Ya (pemilik only) |
| `/users/new` | User Create Form | Ya (pemilik only) |
| `/profile` | Profile/Settings | Ya |

**Bottom Navigation** (3 tab utama):
1. **Dashboard** (`/dashboard`)
2. **Incubator** (`/incubator`)
3. **More** (drawer atau bottom sheet untuk akses menu lain)

**Navigation Drawer** berisi akses ke semua modul:
- Dashboard
- Incubator (Status, Grafik, Settings)
- CCTV
- Indukan (Breeders)
- Telur (Eggs)
- Anakan (Chicks)
- Penjualan (Sales)
- Keuangan (Finance) — hanya tampil jika role = pemilik
- Notifikasi (Alerts)
- Pengguna (Users) — hanya tampil jika role = pemilik
- Profil

---

## 6. Layout per Screen (Detail)

### 6.1 Login Screen
- Email field
- Password field
- Button "Masuk"
- Error snackbar jika gagal
- Auto-fill API Key dari secure storage (bisa diedit di Profile)

### 6.2 Dashboard Screen

```
┌────────────────────────────┐
│  Selamat datang, [nama]    │
├────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐         │
│ │📊 │ │🐣 │ │💰 │         │
│ │ 12 │ │ 3 │ │5jt│         │
│ │Telur│ │Anak│ │Saldo│     │
│ └───┘ └───┘ └───┘         │
│ (saldo hanya untuk pemilik)│
├────────────────────────────┤
│ [Incubator Status Card]    │
│ 🌡️ 37.5°C  💧 60%         │
│ 💡 ON   🔄 2 jam lalu     │
├────────────────────────────┤
│ [Alert Ringkasan]          │
│ ⚠️ 3 notifikasi belum dibaca│
├────────────────────────────┤
│ [Finance Summary - pemilik]│
│ Pemasukan: Rp5.000.000     │
│ Pengeluaran: Rp2.000.000   │
│ Saldo: Rp3.000.000         │
└────────────────────────────┘
```

Sumber status inkubator di dashboard: MQTT realtime (utama) + `GET /api/incubator/status` polling 10–30 dtk (fallback).

### 6.3 Incubator Screen (TabBar)

**Tab 1 — Status:**
- Current temperature (large numeric display, dari MQTT `iot/telemetry/temperature` atau `GET /api/incubator/status`)
- Current humidity
- Lamp status (ON/OFF with icon, dari `iot/telemetry/status_lamp`)
- Status indicator (normal/warning/critical vs threshold settings)

**Tab 2 — Grafik:**
- fl_chart line chart: temperature (line biru) + humidity (line hijau) vs time
- Sumber: trend buffer MQTT (24 titik terakhir, pola `useMqttBridge.js`) + fallback `GET /api/telemetry` (100 log terakhir)
- Range selector (1 jam, 6 jam, 24 jam, 7 hari) — filter client-side dari telemetry logs

**Tab 3 — Kontrol (pemilik/staff only):**
- Publish MQTT: threshold lampu/kelembapan, trigger mist/motor, candling mode (lihat tabel topik §7.4)
- Kunci untuk viewer (read-only)

### 6.4 Settings Screen (Incubator)
- Form untuk edit: suhu min, suhu max, kelembapan min, kelembapan max, interval rotasi
- `PUT /api/incubator/settings` (kontrak `routers/incubator.py`)
- Save button
- Validasi: suhu_min < suhu_max, dll.

### 6.5 Breeders List Screen
- Search bar
- Filter chips (jantan/betina, generasi, status)
- List of breeder cards (nama, jenis kelamin, generasi, varian warna)
- FAB untuk tambah (pemilik/staff only)

### 6.6 Breeder Detail Screen
- Photo (placeholder jika null)
- Nama, jenis kelamin, generasi, varian warna, asal, status
- Tanggal lahir
- Parent info (link ke parent detail)
- Performance metrics: total telur, % fertil, jumlah anakan
- Action buttons: Edit, Lineage, Compare
- Lineage tree (push ke screen baru)

### 6.7 Breeder Form Screen
- Fields sesuai model Breeder
- Dropdown untuk enum: jenis_kelamin, generasi, asal, status, varian_warna
- Tanggal picker
- Select parent jantan & betina dari list breeder
- Mode: Create (POST) / Edit (PUT)
- **Create**: tanpa ID (server generate silsilah otomatis).
- **Edit**: jenis kelamin & parent di-disable (prefix terkunci). Error `422` = prefix diganti, `400` = sudah punya turunan.

### 6.8 Breeder Lineage Screen
- Tree view: 3 generasi ke atas
- Card per breeder, bisa tap untuk lihat detail

### 6.9 Breeder Compare Screen
- Pilih 2+ breeder (search + select chips)
- Side-by-side table: nama, jenis kelamin, generasi, varian, total telur, % fertil, jumlah anakan

### 6.10 Eggs List Screen
- Search bar (cari slot / ID)
- List egg cards (slot, ID, status fertilitas, akhir)
- FAB untuk tambah

### 6.11 Egg Detail Screen
- Slot number, ID
- Induk jantan & betina (link ke breeder detail)
- Tanggal masuk, fertilitas, akhir
- Catatan
- Action: Edit, Delete
- **Create**: tanpa ID (server generate `{Jantan}{Betina}-{NN}`).
- **Edit**: induk di-disable; prefix terkunci. Error `422` = prefix diganti, `400` = sudah punya anakan.

### 6.12 Chicks List Screen
- List chick cards (ID, tanggal menetas, status)
- FAB untuk tambah

### 6.13 Chick Detail Screen
- All fields + photo
- Link ke egg asal
- Induk jantan & betina (auto-inherit, read-only dari server)
- Action: Edit, Delete
- **Create**: tanpa ID (server generate `{eggId}-C{NN}`).
- **Edit**: egg asal di-disable; hanya suffix `-C{NN}` yang berubah. Error `422` = ganti egg.

### 6.14 Sales List Screen
- List sale cards (item, pembeli, status, harga)
- FAB untuk tambah

### 6.15 Sale Detail Screen
- All fields
- Status sale dengan badge warna (Booking/DP/Lunas)
- Action: Edit, Delete

### 6.16 Finance List Screen (pemilik only)
- Summary bar: total pemasukan, pengeluaran, saldo (month/year filter)
- Filter: tipe (Pemasukan/Pengeluaran), kategori, date range
- List entries
- FAB untuk tambah

### 6.17 Alerts Screen
- List alerts dengan badge level (info/warning/critical) dan tipe
- Unread indicator (bold)
- Swipe to mark as read (`PUT /api/alerts/{id}/read`)
- Swipe to delete (pemilik only, `DELETE /api/alerts/{id}`)
- Pull to refresh (polling, tanpa FCM — sesuai `AGENT.md`)

### 6.18 Users Screen (pemilik only)
- List users (nama, email, role)
- FAB untuk tambah user (`POST /auth/register` dengan JWT pemilik)

### 6.19 CCTV Screen — spesifikasi penuh (wajib dibaca sebelum coding)

Arsitektur aktual (lihat `SYSTEM_DOCUMENTATION.md §3C + §5`, `server/rtsp_gateway_example.py`, `nginx.conf`, `src/pages/CctvPage.jsx`):

```
Kamera Bardi (RTSP, e.g. rtsp://admin:****@192.168.110.227:554/V_ENC_000)
  → ESP32 bridge (TCP ke server_host:9000, taskRtspBridge, esp32/incubator_controller.ino)
  → relay_server.py (listen ESP:9000, RTSP:554/8554, status HTTP:9001 /status|/health|/cctv_health)
  → rtsp_gateway_example.py Flask :5000 (OpenCV VideoCapture → resize ≤1280x720 → JPEG q82 → MJPEG multipart)
      GET /video_feed    (inkubator, INCUBATOR_RTSP_URL)
      GET /kandang_feed  (kandang,   KANDANG_RTSP_URL — saat ini memakai streamer yang sama)
      GET /health | /cctv_health → {status, service, incubator_reachable, stream_source, incubator_target(masked), incubator_endpoint, kandang_endpoint}
  → Nginx reverse proxy (HTTPS, proxy_buffering off, timeout 86400s):
      /video_feed   → http://cctv-gateway:5000/video_feed
      /kandang_feed → http://cctv-gateway:5000/kandang_feed
      /cctv_health  → http://cctv-gateway:5000/health
  → Flutter (BASE_URL + path relatif, cache-busting ?t=)
```

Aturan implementasi Flutter:
1. **URL**: `Uri.parse("$BASE_URL/video_feed")` dan `"$BASE_URL/kandang_feed"`. Nilai default path `/video_feed` berasal dari `VITE_RTSP_MJPEG_URL`.
   Jangan hardcode `http://...:5000/...` (itu hanya untuk dev lokal via `vite.config.js` proxy `/video_feed → 127.0.0.1:5000`).
2. **Player**: pakai package MJPEG (`mjpeg` / `flutter_mjpeg`) yang mem-parse `multipart/x-mixed-replace; boundary=frame`
   (~25 FPS ke klien). `Image.network`/`NetworkImage` hanya menampilkan 1 frame — tidak acceptable sebagai "live".
3. **Health polling**: `GET $BASE_URL/cctv_health` tiap **8 detik** (pola `CctvPage.jsx`), baca `incubator_reachable: bool`.
   State badge: `LIVE` (hijau, pulse) / `MENYAMBUNG` (kuning, checking) / `OFFLINE` (merah).
4. **Standby frame**: saat kamera offline gateway mengirim frame diagnostik (bukan hitam) berisi label + target termasking + timestamp.
   Flutter tetap tampilkan overlay error + tombol **Hubungkan Ulang** (reset `?t=<timestamp>` / `Key` baru, set ulang state health) saat `onError` atau `incubator_reachable == false`.
5. **Dua kamera**: Tab/switch **Inkubator** (`/video_feed`, label `INC-CAM-01`) dan **Kandang** (`/kandang_feed`).
   Tampilkan IP termasking hasil parse (pola `extractIp()` di `CctvPage.jsx`) — jangan pernah tampilkan password RTSP.
6. **Auth**: kirim `X-API-Key` (+ JWT jika ada) seperti request API lain; MJPEG package yang tidak support header → fallback: fetch via `HttpClient` dengan header lalu pipe bytes ke parser MJPEG sendiri.
7. **Perf**: resize sudah dilakukan server (≤1280x720); client jangan decode di atas ~25 FPS; pause stream saat screen di-background/dispose.

Layout per feed (meniru `CctvPage.jsx`): header card (judul + badge + tombol reload) → `aspect-video` player hitam →
overlay grid + label `INC-CAM-01 | LIVE MONITORING` → footer deskripsi + `IP: x.x.x.x` + `REST: /video_feed`.

### 6.20 Profile Screen
- User info: nama, email, role
- API Key settings (edit + test connection: `GET /auth/me`)
- MQTT info (read-only ringkas: broker URL tanpa password) + tombol reconnect MQTT
- Logout button

---

## 7. API Service (Dio + Riverpod) + MQTT + CCTV

### 7.1 Konfigurasi Dio (perbaikan dari draft lama)

```dart
// core/config.dart
class AppConfig {
  static const baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'https://api-merak.abdulrosyid.my.id',
  );
  static const apiKeyAndroid = String.fromEnvironment('API_KEY_ANDROID');
  static const mqttUrl = String.fromEnvironment(
    'MQTT_URL',
    defaultValue: 'wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt',
  );
  static const mqttUsername = String.fromEnvironment('MQTT_USERNAME', defaultValue: 'endogmeraq');
  static const mqttPassword = String.fromEnvironment('MQTT_PASSWORD', defaultValue: 'Admin123');
  static const cctvIncubatorPath = String.fromEnvironment('CCTV_INCUBATOR_PATH', defaultValue: '/video_feed');
  static const cctvKandangPath = String.fromEnvironment('CCTV_KANDANG_PATH', defaultValue: '/kandang_feed');
  static const cctvHealthPath = String.fromEnvironment('CCTV_HEALTH_PATH', defaultValue: '/cctv_health');
}
```

```dart
// data/providers/api_client_provider.dart
// Catatan: flutter_secure_storage bersifat async — JANGAN baca sinkron di onRequest.
// Pola benar: preload ke StateProvider saat splash/login, interceptor baca state sinkron.

final apiKeyProvider = StateProvider<String?>((ref) => null);
final jwtTokenProvider = StateProvider<String?>((ref) => null);

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    // Produksi: https://api-merak.abdulrosyid.my.id (bukan https://abdulrosyid.my.id)
    baseUrl: AppConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 30), // CCTV health & polling bisa lambat
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      // 1. X-API-Key wajib di SEMUA request (AGENT.md §2/§8)
      final apiKey = ref.read(apiKeyProvider) ?? AppConfig.apiKeyAndroid;
      if (apiKey != null && apiKey.isNotEmpty) {
        options.headers['X-API-Key'] = apiKey;
      }
      // 2. JWT jika ada (endpoint yang butuh login)
      final token = ref.read(jwtTokenProvider);
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        // Token expired / API Key invalid -> force logout
        ref.read(authProvider.notifier).forceLogout();
      }
      handler.next(error);
    },
  ));

  return dio;
});
```

Splash/startup wajib: baca `flutter_secure_storage` (`api_key`, `jwt_token`) → isi `apiKeyProvider`/`jwtTokenProvider`
sebelum request pertama (pola ini menggantikan `fetchApi()` web di `src/utils/api.js` yang baca `localStorage.getItem("jwt_token")`).

### 7.2 Mapping Endpoint -> Provider Pattern

Setiap modul mengikuti pola yang sama:

```dart
// Contoh: breeders_provider.dart

// 1. AsyncNotifier untuk list
final breedersListProvider = AsyncNotifierProvider<BreedersListNotifier, List<Breeder>>(
  BreedersListNotifier.new,
);

// 2. FutureProvider untuk detail
final breederDetailProvider = FutureProvider.family<Breeder, String>((ref, id) async {
  final dio = ref.read(apiClientProvider);
  final response = await dio.get('/api/breeders/$id');
  return Breeder.fromJson(response.data);
});

// 3. AsyncNotifier untuk form (create/update)
final breederFormProvider = AsyncNotifierProvider.family<BreederFormNotifier, void, Breeder?>(...);
```

Semua `GET` operasional tetap kirim `X-API-Key` walau tanpa JWT (viewer/publik).

### 7.3 Daftar Lengkap Panggilan API

`Base URL = https://api-merak.abdulrosyid.my.id`. Status kolom terakhir = kondisi implementasi backend hari ini.

| Method | Endpoint | Provider / Fungsi | Auth | Status backend |
|--------|----------|------------------|------|----------------|
| POST | `/auth/login` | `authProvider.login(email, password)` | publik + API Key | kontrak `routers/auth.py` (belum mount) |
| GET | `/auth/me` | `authProvider.fetchMe()` | JWT pemilik/staff | kontrak (belum mount) |
| POST | `/auth/register` | `userFormProvider.create(data)` | JWT pemilik only | kontrak (belum mount) |
| GET | `/api/dashboard/summary` | `dashboardProvider` | JWT pemilik/staff | kontrak `routers/dashboard.py` (belum mount) |
| GET | `/api/incubator/settings` | `mqttConfigProvider` (live: MqttConfig) → `incubatorSettingsProvider` (kontrak threshold) | publik + API Key | **LIVE** via `main.py`, tapi me-return **MqttConfig** (lihat §7.4) |
| PUT | `/api/incubator/settings` | `incubatorSettingsProvider.update(data)` | JWT pemilik/staff | kontrak `routers/incubator.py` (belum mount) |
| GET | `/api/incubator/status` | `incubatorStatusProvider` (+ fallback MQTT) | publik + API Key | kontrak `routers/incubator.py` (belum mount) |
| POST | `/api/incubator/status` | device/internal only (JANGAN dipanggil dari UI user) | API Key device | kontrak (auto-alert) |
| GET | `/api/telemetry` | `telemetryProvider` (100 log terakhir, fallback grafik) | publik + API Key | **LIVE** via `main.py` |
| POST | `/api/telemetry` | `telemetryProvider.push({timestamp, temperature, humidity})` (opsional, device/sync) | API Key | **LIVE** via `main.py` |
| GET | `/api/breeders` | `breedersListProvider` | publik + API Key | kontrak `routers/breeders.py` (belum mount) |
| GET | `/api/breeders/{id}` | `breederDetailProvider(id)` | publik + API Key | kontrak (belum mount) |
| GET | `/api/breeders/{id}/lineage` | `breederLineageProvider(id)` | publik + API Key | kontrak (belum mount) |
| GET | `/api/breeders/compare?ids=A,B` | `breederCompareProvider(ids)` | publik + API Key | kontrak (belum mount) |
| POST | `/api/breeders` | `breederFormProvider.create(data)` | JWT pemilik/staff | kontrak (belum mount) |
| PUT | `/api/breeders/{id}` | `breederFormProvider.update(id, data)` | JWT pemilik/staff | kontrak (belum mount) |
| DELETE | `/api/breeders/{id}` | `breedersListProvider.delete(id)` | JWT **pemilik only** | kontrak (belum mount) |
| GET | `/api/eggs` | `eggsListProvider` | publik + API Key | **LIVE** via `main.py` (tanpa induk IDs — lihat §4.3) |
| GET | `/api/eggs/{id}` | `eggDetailProvider(id)` | publik + API Key | kontrak `routers/eggs.py` (belum mount) |
| POST | `/api/eggs` | `eggFormProvider.create(data)` | JWT pemilik/staff | **LIVE** (400 jika `slot` sudah terisi) |
| PUT | `/api/eggs/{id}` | `eggFormProvider.update(id, data)` | JWT pemilik/staff | kontrak (belum mount) |
| DELETE | `/api/eggs/{id}` | `eggsListProvider.delete(id)` | JWT **pemilik only** | kontrak (belum mount) |
| GET | `/api/chicks` | `chicksListProvider` | publik + API Key | kontrak `routers/chicks.py` (belum mount) |
| GET | `/api/chicks/{id}` | `chickDetailProvider(id)` | publik + API Key | kontrak (belum mount) |
| POST | `/api/chicks` | `chickFormProvider.create(data)` | JWT pemilik/staff | kontrak (belum mount) |
| PUT | `/api/chicks/{id}` | `chickFormProvider.update(id, data)` | JWT pemilik/staff | kontrak (belum mount) |
| DELETE | `/api/chicks/{id}` | `chicksListProvider.delete(id)` | JWT **pemilik only** | kontrak (belum mount) |
| GET | `/api/sales` | `salesListProvider` | publik + API Key | **LIVE** via `main.py` |
| GET | `/api/sales/{id}` | `saleDetailProvider(id)` | publik + API Key | kontrak `routers/sales.py` (belum mount) |
| POST | `/api/sales` | `saleFormProvider.create(data)` | JWT pemilik/staff | **LIVE** via `main.py` |
| PUT | `/api/sales/{id}` | `saleFormProvider.update(id, data)` | JWT pemilik/staff | kontrak (belum mount) |
| DELETE | `/api/sales/{id}` | `salesListProvider.delete(id)` | JWT **pemilik only** | kontrak (belum mount) |
| GET | `/api/finance` | `financeListProvider` (pemilik only) | JWT pemilik | kontrak `routers/finance.py` (belum mount) |
| GET | `/api/finance/{id}` | `financeDetailProvider(id)` | JWT pemilik | kontrak (belum mount) |
| POST | `/api/finance` | `financeFormProvider.create(data)` | JWT pemilik | kontrak (belum mount) |
| PUT | `/api/finance/{id}` | `financeFormProvider.update(id, data)` | JWT pemilik | kontrak (belum mount) |
| DELETE | `/api/finance/{id}` | `financeListProvider.delete(id)` | JWT pemilik | kontrak (belum mount) |
| GET | `/api/alerts` | `alertsListProvider` | JWT pemilik/staff | kontrak `routers/alerts.py` (belum mount) |
| PUT | `/api/alerts/{id}/read` | `alertsListProvider.markRead(id)` | JWT pemilik/staff | kontrak (belum mount) |
| DELETE | `/api/alerts/{id}` | `alertsListProvider.delete(id)` | JWT **pemilik only** | kontrak (belum mount) |
| GET | `/api/users` | `usersListProvider` (pemilik only) | JWT pemilik | kontrak `routers/users.py` (belum mount) |
| PUT | `/api/users/{id}` | `userFormProvider.update(id, data)` | JWT pemilik | kontrak (belum mount) |
| DELETE | `/api/users/{id}` | `usersListProvider.delete(id)` | JWT pemilik | kontrak (belum mount) |
| GET | `/cctv_health` | `cctvProvider.pollHealth()` tiap 8 dtk | API Key (+JWT bila ada) | **LIVE** via Nginx → gateway `:5000/health` |
| GET | `/video_feed` | MJPEG player inkubator | API Key (lihat §6.19.6) | **LIVE** via Nginx → gateway |
| GET | `/kandang_feed` | MJPEG player kandang | API Key (lihat §6.19.6) | **LIVE** via Nginx → gateway |

> Error standar: `401` belum login/key salah, `403` role ditolak, `404` data/route belum ada (termasuk router belum mount),
> `422` validasi gagal, `429` rate-limit (`AGENT.md` §8.4). Handle `404` router-belum-mount dengan empty-state + tombol retry.

### 7.4 MQTT Realtime — konfigurasi & topik (wajib untuk grafik + kontrol)

Sumber kebenaran: `.env` web, `src/hooks/useMqttBridge.js`, `src/data/constants.js`, `esp32/incubator_controller.ino`.

1. **Ambil config dari API dulu** (agar tidak rebuild saat broker pindah):
   `GET /api/incubator/settings` → `{mqtt_url, mqtt_username, mqtt_password, status}`.
   Fallback: `--dart-define` (`MQTT_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`) → default web:
   `wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt` / `endogmeraq` / `Admin123`.
   Catatan: kredensial di atas juga dipakai ESP32 (`mqtt_server 9170ac9...s1.eu.hivemq.cloud:8883`, user `endoqmerak`).
2. **Klien Flutter** (`mqtt_client`): WebSocket, `clientId: pavoprecise-<rand>`, `clean: true`, `keepalive: 30`,
   `connectTimeout: 10s`, `reconnectPeriod: 3s`, `resubscribe: true`. Status: `idle/connecting/connected/reconnecting/offline/error`
   + `lastTelemetryAt` (pola `useMqttBridge.js`).
3. **Subscribe** (`qos: 0`):

   | Topik | Isi | Provider |
   |-------|-----|----------|
   | `iot/telemetry/temperature` | float °C (ESP32 publish tiap 5 dtk, sensor SHT31) | `mqttProvider.telemetry.temperature` + trend buffer 24 titik |
   | `iot/telemetry/humidity` | float % | `mqttProvider.telemetry.humidity` + trend buffer 24 titik |
   | `iot/telemetry/status_lamp` | `ON`/`OFF` | `statusLamp` |
   | `iot/telemetry/status_motor` | `ON`/`OFF` | `statusMotor` |
   | `iot/telemetry/status_mist` | `ON`/`OFF` | `statusMist` |

4. **Publish (command, pemilik/staff only, kunci di viewer)**:

   | Topik | Payload | Aksi web saat ini |
   |-------|---------|-------------------|
   | `iot/cmd/lamp_thresh_on` | float | set threshold bawah lampu |
   | `iot/cmd/lamp_thresh_off` | float | set threshold atas lampu |
   | `iot/cmd/humidity_thresh_low` | int | `MqttCommandPanel` |
   | `iot/cmd/humidity_thresh_high` | int | `MqttCommandPanel` |
   | `iot/cmd/lamp_mode` | `AUTO`/`MANUAL` | — |
   | `iot/cmd/motor_trigger` | `TRIGGER` | putar rak manual |
   | `iot/cmd/motor_turns` | int | jumlah putaran |
   | `iot/cmd/mist_trigger` | `TRIGGER` | picu mist maker |
   | `iot/cmd/candling_mode` | `ON`/`OFF` | `EmergencyControlPanel` |
   | `iot/cmd/alert_ack` | `id` | `AlertPanel` acknowledge |

5. **Fallback REST** saat MQTT offline: polling `GET /api/incubator/status` (10–30 dtk) untuk angka terkini
   dan `GET /api/telemetry` untuk grafik. Jangan blokir UI saat broker unreachable.
6. **Keamanan**: simpan password MQTT di `flutter_secure_storage`, jangan log password (gateway menmasking jadi `****`, ikuti itu).

### 7.5 CCTV Service — contoh kode

```dart
// data/services/cctv_service.dart
class CctvService {
  CctvService(this._dio);
  final Dio _dio;

  Uri incubatorFeed() => Uri.parse('${AppConfig.baseUrl}${AppConfig.cctvIncubatorPath}');
  Uri kandangFeed() => Uri.parse('${AppConfig.baseUrl}${AppConfig.cctvKandangPath}');

  /// Health polling tiap 8 detik (pola CctvPage.jsx).
  Future<bool?> fetchReachable() async {
    final res = await _dio.get(AppConfig.cctvHealthPath); // /cctv_health
    final data = res.data;
    if (data is Map<String, dynamic>) {
      final v = data['incubator_reachable'];
      return v is bool ? v : null;
    }
    return null;
  }
}
```

```dart
// features/cctv/cctv_screen.dart (sketsa)
enum CctvState { checking, live, offline }

class CctvScreen extends ConsumerStatefulWidget { ... }
// - Tab/segmented: Inkubator (/video_feed) | Kandang (/kandang_feed)
// - Timer.periodic(8s) -> cctvService.fetchReachable()
// - Mjpeg(cell) dengan key = feedUri.replace(queryParameters: {'t': '$cacheBuster'})
//   agar tombol Hubungkan Ulang memaksa koneksi baru
// - onError / reachable==false -> CctvErrorView (videocam_off + Hubungkan Ulang)
// - Badge: LIVE (hijau pulse) / MENYAMBUNG (kuning) / OFFLINE (merah)
```

> **Kontrak silsilah (semua POST breeders/eggs/chicks):** field `id` opsional, kosongkan agar server generate. Body PUT tidak boleh mengubah field terkunci (`jenis_kelamin`/`parent_*`, `induk_*`, `egg_id`); `id` di body = id baru yang hanya boleh beda suffix. Error `422` = prefix diganti, `400` = ID dipakai / sudah punya turunan.

### 7.4 Pola ID Silsilah (catatan, tanpa kode)

> Breeder F0 `JB{NN}`/`BB{NN}`, telur/anak `{Jantan}{Betina}-{NN}`, chick `{eggId}-C{NN}`. Prefix dibaca langsung dari ID sehingga badge silsilah bisa dirender offline; ID lama (`MRK-`/`EGG-`/`CHK-`) tetap ditampilkan apa adanya.

---

## 8. Role-Based UI

Setiap screen dan action harus cek role user:

- **Pemilik**: Lihat semua menu (termasuk Finance & Users), bisa CRUD semua.
- **Staff**: Tidak melihat menu Finance & Users. Bisa CRUD data operasional.
- **Viewer (tidak login)**: Hanya bisa lihat halaman publik (Breeders, Eggs, Chicks, Incubator, Sales). Tidak bisa Create/Edit/Delete.

Implementasi:

```dart
class RoleGuard extends ConsumerWidget {
  final Widget child;
  final List<String> allowedRoles;

  const RoleGuard({super.key, required this.child, required this.allowedRoles});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null || !allowedRoles.contains(user.role)) {
      return AccessDeniedScreen();
    }
    return child;
  }
}
```

Tambahan vs web (`ROLES` di `src/data/constants.js` memakai `admin/operator/viewer`):
backend memakai `pemilik/staff`. Flutter wajib mapping `admin→pemilik`, `operator→staff` saat parsing JWT/user.

---

## 9. Theming & Branding

- **Warna primer**: Hijau emas (natural/bird theme)
  - `primary`: `#2E7D32` (hijau)
  - `secondary`: `#F9A825` (emas)
  - `surface`: `#F5F5F5`
  - `error`: `#D32F2F`
- **Warna status**:
  - Normal: `#4CAF50` (hijau)
  - Warning: `#FFC107` (kuning)
  - Critical: `#F44336` (merah)
- **CCTV**: badge `LIVE` hijau pulse / `MENYAMBUNG` kuning / `OFFLINE` merah; player background hitam `aspect-video`
- **Font**: System default atau Google Fonts (Montserrat / Inter)
- **Icons**: Material Icons
- **Dark mode**: Opsional, bisa ditambahkan nanti

---

## 10. Fitur Offline / Caching (Opsional, Pasca-MVP)

- Cache data dashboard dan incubator status dengan `shared_preferences`
- Telemetry logs (`GET /api/telemetry`) disimpan lokal untuk grafik offline
- Queue create/update operation saat offline (dengan `workmanager` atau `drift`)
- CCTV tidak di-cache (live only); saat offline tampilkan state `OFFLINE` + tombol retry, bukan frame basi

---

## 11. Testing Strategy

| Level | Tools | Scope |
|-------|-------|-------|
| **Unit Test** | `flutter_test` | Model fromJson/toJson, validators, formatters |
| **Widget Test** | `flutter_test` | Per screen: render, loading, error, empty state |
| **Integration Test** | `integration_test` | Login -> Dashboard -> CRUD flow |

Tambahan wajib: widget test `CctvScreen` (mock `CctvService.fetchReachable` → LIVE/OFFLINE), parser MJPEG boundary,
dan mapping error `404` router-belum-mount → empty-state (bukan crash).

---

## 12. Environment & Build

```yaml
# pubspec.yaml dependencies
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  dio: ^5.7.0
  go_router: ^14.8.0
  flutter_secure_storage: ^9.2.4
  fl_chart: ^0.70.2
  intl: ^0.20.2
  cached_network_image: ^3.4.1
  image_picker: ^1.1.2
  mqtt_client: ^10.6.1        # MQTT WebSocket (realtime sensor, §7.4)
  mjpeg: ^1.0.0               # ATAU flutter_mjpeg — MJPEG multipart player CCTV (§6.19/§7.5)

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  build_runner: ^2.4.14
  riverpod_generator: ^2.6.3
```

**Variabel environment (samakan dengan `.env` web + `server/.env`):**

| Flutter `--dart-define` | Default / sumber web | Keterangan |
|---|---|---|
| `BASE_URL` | `https://api-merak.abdulrosyid.my.id` (`VITE_API_BASE_URL`) | REST + CCTV (path relatif) |
| `API_KEY_ANDROID` | (wajib diisi saat build) | `X-API-Key` khusus Android, beda dari `VITE_API_KEY_WEB` |
| `MQTT_URL` | `wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt` (`VITE_MQTT_URL`) | override oleh `GET /api/incubator/settings` bila sukses |
| `MQTT_USERNAME` | `endogmeraq` (`VITE_MQTT_USERNAME`) | — |
| `MQTT_PASSWORD` | `Admin123` (`VITE_MQTT_PASSWORD`) | simpan di secure storage |
| `CCTV_INCUBATOR_PATH` | `/video_feed` (`VITE_RTSP_MJPEG_URL`) | feed inkubator |
| `CCTV_KANDANG_PATH` | `/kandang_feed` | feed kandang |
| `CCTV_HEALTH_PATH` | `/cctv_health` | health polling 8 dtk |

**Build command:**

```bash
flutter build apk \
  --dart-define=BASE_URL=https://api-merak.abdulrosyid.my.id \
  --dart-define=API_KEY_ANDROID=xxx \
  --dart-define=MQTT_URL=wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt \
  --dart-define=MQTT_USERNAME=endogmeraq \
  --dart-define=MQTT_PASSWORD=xxx

flutter build appbundle \
  --dart-define=BASE_URL=https://api-merak.abdulrosyid.my.id \
  --dart-define=API_KEY_ANDROID=xxx \
  --dart-define=MQTT_URL=wss://9310d9f5197b4c38a2107e957d131f22.s1.eu.hivemq.cloud:8884/mqtt \
  --dart-define=MQTT_USERNAME=endogmeraq \
  --dart-define=MQTT_PASSWORD=xxx
```

---

## 13. Urutan Prioritas Pengembangan

| Fase | Fitur |
|------|-------|
| **MVP (Fase 1)** | Auth (login + API Key), Dashboard, Incubator (status + grafik MQTT/REST + settings), Alerts (polling), **CCTV (2 feed + health, karena sudah LIVE di web)** |
| **Fase 2** | Breeders (list + detail + CRUD), Eggs (list + detail + CRUD), Chicks (list + detail + CRUD) |
| **Fase 3** | Sales, Finance (pemilik), Users (pemilik), kontrol MQTT (threshold/mist/motor/candling, pemilik/staff) |
| **Fase 4** | Breeder lineage tree, Breeder compare, search/filter refinement, UI polish |
| **Pasca-MVP** | Offline cache, push notification (FCM), multi-incubator, QR/Certificate |

---

## 14. Referensi Konfigurasi Backend / CCTV / MQTT (jangan diduplikasi, cukup dibaca)

| Komponen | File sumber | Isi relevan untuk Flutter |
|---|---|---|
| Kontrak API + role + middleware order | `AGENT.md` §2–§8 | `X-API-Key` wajib semua request; JWT 24 jam; viewer = publik tanpa login |
| Router yang belum mount | `fastapi-backend/app/routers/*.py` vs `fastapi-backend/app/main.py` | coding ke kontrak, tahan `404` |
| Auth JWT | `fastapi-backend/app/auth.py` | `HS256`, `JWT_SECRET`, `require_role(...)` |
| DB | `fastapi-backend/app/database.py` | MySQL `kampung_merak` (fallback SQLite lokal bila `MYSQL_HOST` kosong) |
| MQTT config live | `GET /api/incubator/settings` (`main.py`) | `{mqtt_url, mqtt_username, mqtt_password, status}` |
| Telemetry live | `GET/POST /api/telemetry` (`main.py`, `schemas.py`, `models.py`) | `{id, timestamp, temperature, humidity}`, 100 terbaru |
| Auto-alert | `routers/incubator.py::check_and_create_alerts` | suhu→critical, kelembapan→warning |
| Dashboard tahan-error | `routers/dashboard.py::dashboard_summary` | return nol + `finance_summary` hanya pemilik |
| Web API wrapper | `src/utils/api.js` | header `X-API-Key` + `Authorization`, pola error `detail` |
| MQTT hook web | `src/hooks/useMqttBridge.js` | fetch config → connect → subscribe → trend buffer 24 |
| Topik + role web | `src/data/constants.js` | `MQTT_TOPICS`, `SUBSCRIBE_TOPICS`, `ROLES admin/operator/viewer` |
| CCTV page web | `src/pages/CctvPage.jsx` | health polling 8 dtk, `?t=` cache-bust, badge LIVE/OFFLINE |
| Gateway MJPEG | `server/rtsp_gateway_example.py` | `:5000/video_feed`, `:5000/kandang_feed`, `:5000/health`, resize ≤1280x720, standby frame, mask password |
| Relay ESP32 | `server/relay_server.py` | ESP `:9000`, RTSP `:554/:8554`, status `:9001/status` |
| RTSP env | `server/.env`, root `.env` | `INCUBATOR_RTSP_URL`, `KANDANG_RTSP_URL`, `VITE_RTSP_MJPEG_URL=/video_feed` |
| Proxy dev | `vite.config.js` | `/api,/auth → https://api-merak.abdulrosyid.my.id`, `/video_feed → 127.0.0.1:5000` |
| Proxy prod | `nginx.conf` | `/api/, /auth/ → api-merak...`, `/video_feed`, `/kandang_feed`, `/cctv_health → cctv-gateway:5000` |
| ESP32 firmware | `esp32/incubator_controller.ino` | SHT31 publish 5 dtk, topik `iot/telemetry/*` + `iot/cmd/*`, RTSP bridge Core 0 |
| Deploy | `SYSTEM_DOCUMENTATION.md §5`, `docker-compose.yml` | gateway via PM2/systemd; frontend `:8087→:80` |
