# MOBILE.md — PavoPrecise / Kampung Merak (Flutter Mobile App)

> Dokumen ini adalah *single source of truth* untuk pengembangan aplikasi mobile Flutter.
> **Backend API**: FastAPI di `fastapi-backend/` — lihat `README.md` dan `AGENT.md` untuk detail endpoint.

---

## 1. Tech Stack

| Layer | Pilihan |
|-------|---------|
| Framework | Flutter (Dart) |
| State Management | **Riverpod** (`flutter_riverpod`) |
| HTTP Client | **Dio** (`dio`) |
| Routing | **GoRouter** (`go_router`) |
| Charts | **fl_chart** (line chart suhu & kelembapan) |
| Secure Storage | **flutter_secure_storage** (token JWT + API Key) |
| Pull-to-Refresh | `RefreshIndicator` built-in |
| Build | APK / App Bundle via `flutter build` |

---

## 2. Autentikasi & Keamanan

- **API Key global**: `X-API-Key` disimpan di `flutter_secure_storage`, disisipkan Dio interceptor ke **setiap** request.
- **JWT Token**: Disimpan di `flutter_secure_storage` setelah login, dikirim via `Authorization: Bearer <token>` untuk endpoint yang butuh login.
- **Logout**: Hapus token dari secure storage, redirect ke login.
- **API Key default**: Di-bundle di BuildConfig (atau env Flutter `--dart-define`) untuk instalasi pertama — user bisa ganti di settings.

---

## 3. Struktur Folder Flutter

```
pavoprecise_app/
├── lib/
│   ├── main.dart
│   ├── app.dart                          # MaterialApp + GoRouter
│   │
│   ├── core/
│   │   ├── constants.dart                # base URL, enum mapping, dll
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
│   │   │   ├── incubator_settings.dart
│   │   │   ├── incubator_status.dart
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
│   │   │   ├── incubator_provider.dart
│   │   │   ├── sales_provider.dart
│   │   │   ├── finance_provider.dart
│   │   │   ├── alerts_provider.dart
│   │   │   └── users_provider.dart
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
│   │   │       ├── status_widget.dart
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
│   │   │   └── cctv_screen.dart          # MJPEG stream viewer
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
  final String id;           // "MRK-F0-001"
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

### 4.3 Egg

```dart
class Egg {
  final String id;           // "EGG-001"
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

### 4.4 Chick

```dart
class Chick {
  final String id;           // "CHK-001"
  final String eggId;
  final String? indukJantanId;  // auto-inherit dari egg
  final String? indukBetinaId;  // auto-inherit dari egg
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

### 4.5 IncubatorSettings

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
  final String pesan;
  final String level;         // "info" | "warning" | "critical"
  final bool isRead;
  final DateTime? createdAt;

  Alert({...});
  factory Alert.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  Alert copyWith({...});
}
```

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

---

## 5. Navigation & Routing (GoRouter)

| Path | Screen | Auth Required |
|------|--------|---------------|
| `/` | Redirect ke `/dashboard` atau `/login` | — |
| `/login` | Login Screen | Tidak |
| `/dashboard` | Dashboard Screen | Ya |
| `/incubator` | Incubator Screen (Tabs) | Ya (read: publik) |
| `/incubator/settings` | Incubator Settings Form | Ya (pemilik/staff) |
| `/cctv` | CCTV Stream Screen | Ya |
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

### 6.3 Incubator Screen (TabBar)

**Tab 1 — Status:**
- Current temperature (large numeric display)
- Current humidity
- Lamp status (ON/OFF with icon)
- Status indicator (normal/warning/critical)

**Tab 2 — Grafik:**
- fl_chart line chart: temperature (line biru) + humidity (line hijau) vs time
- Range selector (1 jam, 6 jam, 24 jam, 7 hari)

### 6.4 Settings Screen (Incubator)
- Form untuk edit: suhu min, suhu max, kelembapan min, kelembapan max, interval rotasi
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

### 6.12 Chicks List Screen
- List chick cards (ID, tanggal menetas, status)
- FAB untuk tambah

### 6.13 Chick Detail Screen
- All fields + photo
- Link ke egg asal
- Induk jantan & betina (auto-inherit)
- Action: Edit, Delete

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
- Swipe to mark as read
- Swipe to delete (pemilik only)
- Pull to refresh

### 6.18 Users Screen (pemilik only)
- List users (nama, email, role)
- FAB untuk tambah user

### 6.19 CCTV Screen
- MJPEG stream player (gunakan `NetworkImage` atau package `mjpeg`)
- URL input (default dari server: `http://BASE:5000/video_feed`)
- Switch antara kamera inkubator dan kandang

### 6.20 Profile Screen
- User info: nama, email, role
- API Key settings (edit + test connection)
- Logout button

---

## 7. API Service (Dio + Riverpod)

### 7.1 Konfigurasi Dio

```dart
// api_client_provider.dart
final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: 'https://abdulrosyid.my.id',
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10),
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      // 1. Sertakan X-API-Key
      final apiKey = ref.read(secureStorageProvider).read(key: 'api_key');
      options.headers['X-API-Key'] = apiKey ?? 'dev-api-key-android';

      // 2. Sertakan JWT jika ada
      final token = ref.read(secureStorageProvider).read(key: 'jwt_token');
      if (token != null) {
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

### 7.3 Daftar Lengkap Panggilan API

| Method | Endpoint | Provider / Fungsi |
|--------|----------|------------------|
| POST | `/auth/login` | `authProvider.login(email, password)` |
| GET | `/auth/me` | `authProvider.fetchMe()` |
| GET | `/api/dashboard/summary` | `dashboardProvider` |
| GET | `/api/incubator/status` | `incubatorStatusProvider` |
| GET | `/api/incubator/settings` | `incubatorSettingsProvider` |
| PUT | `/api/incubator/settings` | `incubatorSettingsProvider.update(data)` |
| GET | `/api/breeders` | `breedersListProvider` |
| GET | `/api/breeders/{id}` | `breederDetailProvider(id)` |
| GET | `/api/breeders/{id}/lineage` | `breederLineageProvider(id)` |
| GET | `/api/breeders/compare?ids=A,B` | `breederCompareProvider(ids)` |
| POST | `/api/breeders` | `breederFormProvider.create(data)` |
| PUT | `/api/breeders/{id}` | `breederFormProvider.update(id, data)` |
| DELETE | `/api/breeders/{id}` | `breedersListProvider.delete(id)` |
| GET | `/api/eggs` | `eggsListProvider` |
| GET | `/api/eggs/{id}` | `eggDetailProvider(id)` |
| POST | `/api/eggs` | `eggFormProvider.create(data)` |
| PUT | `/api/eggs/{id}` | `eggFormProvider.update(id, data)` |
| DELETE | `/api/eggs/{id}` | `eggsListProvider.delete(id)` |
| GET | `/api/chicks` | `chicksListProvider` |
| GET | `/api/chicks/{id}` | `chickDetailProvider(id)` |
| POST | `/api/chicks` | `chickFormProvider.create(data)` |
| PUT | `/api/chicks/{id}` | `chickFormProvider.update(id, data)` |
| DELETE | `/api/chicks/{id}` | `chicksListProvider.delete(id)` |
| GET | `/api/sales` | `salesListProvider` |
| GET | `/api/sales/{id}` | `saleDetailProvider(id)` |
| POST | `/api/sales` | `saleFormProvider.create(data)` |
| PUT | `/api/sales/{id}` | `saleFormProvider.update(id, data)` |
| DELETE | `/api/sales/{id}` | `salesListProvider.delete(id)` |
| GET | `/api/finance` | `financeListProvider` (pemilik only) |
| GET | `/api/finance/{id}` | `financeDetailProvider(id)` |
| POST | `/api/finance` | `financeFormProvider.create(data)` |
| PUT | `/api/finance/{id}` | `financeFormProvider.update(id, data)` |
| DELETE | `/api/finance/{id}` | `financeListProvider.delete(id)` |
| GET | `/api/alerts` | `alertsListProvider` |
| PUT | `/api/alerts/{id}/read` | `alertsListProvider.markRead(id)` |
| DELETE | `/api/alerts/{id}` | `alertsListProvider.delete(id)` |
| GET | `/api/users` | `usersListProvider` (pemilik only) |
| POST | `/auth/register` | `userFormProvider.create(data)` |
| PUT | `/api/users/{id}` | `userFormProvider.update(id, data)` |
| DELETE | `/api/users/{id}` | `usersListProvider.delete(id)` |

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
- **Font**: System default atau Google Fonts (Montserrat / Inter)
- **Icons**: Material Icons
- **Dark mode**: Opsional, bisa ditambahkan nanti

---

## 10. Fitur Offline / Caching (Opsional, Pasca-MVP)

- Cache data dashboard dan incubator status dengan `shared_preferences`
- Telemetry logs disimpan lokal untuk grafik offline
- Queue create/update operation saat offline (dengan `workmanager` atau `drift`)

---

## 11. Testing Strategy

| Level | Tools | Scope |
|-------|-------|-------|
| **Unit Test** | `flutter_test` | Model fromJson/toJson, validators, formatters |
| **Widget Test** | `flutter_test` | Per screen: render, loading, error, empty state |
| **Integration Test** | `integration_test` | Login -> Dashboard -> CRUD flow |

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

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  build_runner: ^2.4.14
  riverpod_generator: ^2.6.3
```

**Build command:**

```bash
flutter build apk --dart-define=API_KEY_ANDROID=xxx --dart-define=BASE_URL=https://abdulrosyid.my.id

flutter build appbundle --dart-define=API_KEY_ANDROID=xxx --dart-define=BASE_URL=https://abdulrosyid.my.id
```

---

## 13. Urutan Prioritas Pengembangan

| Fase | Fitur |
|------|-------|
| **MVP (Fase 1)** | Auth (login), Dashboard, Incubator (status + grafik + settings), Alerts |
| **Fase 2** | Breeders (list + detail + CRUD), Eggs (list + detail + CRUD), Chicks (list + detail + CRUD) |
| **Fase 3** | Sales, Finance (pemilik), Users (pemilik), CCTV stream |
| **Fase 4** | Breeder lineage tree, Breeder compare, search/filter refinement, UI polish |
| **Pasca-MVP** | Offline cache, push notification (FCM), multi-incubator, QR/Certificate |
