// ========================
// MQTT Topics
// ========================
export const MQTT_TOPICS = {
  temperature: "iot/telemetry/temperature",
  humidity: "iot/telemetry/humidity",
  statusLamp: "iot/telemetry/status_lamp",
  statusMotor: "iot/telemetry/status_motor",
  statusMist: "iot/telemetry/status_mist",
  lampThresholdOn: "iot/cmd/lamp_thresh_on",
  lampThresholdOff: "iot/cmd/lamp_thresh_off",
  humidityThresholdLow: "iot/cmd/humidity_thresh_low",
  humidityThresholdHigh: "iot/cmd/humidity_thresh_high",
  lampMode: "iot/cmd/lamp_mode",
  motorTurns: "iot/cmd/motor_turns",
  motorTrigger: "iot/cmd/motor_trigger",
  mistTrigger: "iot/cmd/mist_trigger",
  candlingMode: "iot/cmd/candling_mode",
  alertAck: "iot/cmd/alert_ack",
};

export const SUBSCRIBE_TOPICS = [
  MQTT_TOPICS.temperature,
  MQTT_TOPICS.humidity,
  MQTT_TOPICS.statusLamp,
  MQTT_TOPICS.statusMotor,
  MQTT_TOPICS.statusMist,
];

// ========================
// Species Profiles
// ========================
export const VARIETAS = {
  hijau: {
    label: "Merak Hijau",
    latin: "Pavo muticus",
    accent: "#006b58",
    accentSoft: "#6cfad7",
    chipText: "#00725e",
    dark: "#0b2b26",
    batch: "MRK-2026-H1",
    masa: "±28 hari",
    suhuIdeal: "37.5°C - 38.0°C",
    kelembabanIdeal: "45% - 50%",
    candling: "Hari ke-7 sampai hari ke-10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGSrMpNfVPtQJEhcyCmCQ1zVnVQHBTzQKhFXbEOKt1TCWYofnXzRejvvzmM0DNzvcHE-hi4Ms1n7C3d2lMK95SR8UeiBem943AJs2l45borYHvQowXqgwDYVMRqO9XsdI5DwZnX9IHpNhFfbTK2JaEdJ5JGkWdJLqdLFzYoCn38Uj7CQicjogDH0n0Hd_GZVMSVD_YaIJsi8s4rZy_fXH3eSLAQMYD0DH3mFKG_jWp0w9yFXOIgl0Qj4k29HsqzaLyb3rSx0Pf7DQ",
    ringkasan:
      "Profil ini digunakan untuk batch telur merak hijau. Fokus sistem adalah menjaga kestabilan suhu, kelembaban, pemutaran rak, dan dokumentasi status telur selama masa inkubasi.",
    asal: "Asia Tenggara (Indonesia, Myanmar, Thailand)",
    statusKonservasi: "Endangered (IUCN)",
    ciriFisik: "Bulu tubuh hijau keemasan dengan leher hijau metalik",
    ukuran: "Panjang 180–250 cm (termasuk ekor)",
    habitat: "Hutan tropis dataran rendah dan pegunungan",
    populasi: "± 10.000–20.000 ekor di alam liar",
  },
  biru: {
    label: "Merak Biru",
    latin: "Pavo cristatus",
    accent: "#4addbb",
    accentSoft: "#d8fff6",
    chipText: "#4addbb",
    dark: "#0b2b26",
    batch: "MRK-2026-B1",
    masa: "±28 hari",
    suhuIdeal: "37.5°C - 38.0°C",
    kelembabanIdeal: "45% - 50%",
    candling: "Hari ke-7 sampai hari ke-10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP4YzUuDoB10IszzavrKrB9H4d2-D4q_VZsr_WlnexxX6-rcXKoWcX7jt8wS-9BH9LtvSPmC8SIr8Qtz58xTXaxdoAfhQnn85jjlLhwpAi-KbSu1YozciNzYUqxdODpf3dL7YXZsqAU6vtsJoQwArGrXTgStoBjdkTnFkA5CofhKeViYlymjFGZ4p5x5ECh-cvPklq4CdTZALFxmOupv8-1L7WiXPQ65hp0QT64IGX1wMTuGpm2WQ9Da-GaHMtVQG-4Zk_NwgXJx4",
    ringkasan:
      "Profil ini digunakan untuk batch telur merak biru. Warna aksen dashboard berubah untuk membedakan batch, sedangkan kendali teknis inkubator tetap mengikuti standar suhu dan kelembaban yang sama.",
    asal: "Asia Selatan (India, Sri Lanka, Pakistan)",
    statusKonservasi: "Least Concern (IUCN)",
    ciriFisik: "Bulu tubuh biru metalik yang mencolok dengan corak mata pada ekor",
    ukuran: "Panjang 100–115 cm (tanpa ekor panjang)",
    habitat: "Hutan sekunder, perbukitan, dan lahan pertanian",
    populasi: "Populasi stabil, tersebar luas",
  },
};

// ========================
// Benchmark: Perbandingan Varietas
// ========================
export const VARIETAS_BENCHMARK = [
  { label: "Nama Ilmiah",        hijau: "Pavo muticus",              biru: "Pavo cristatus" },
  { label: "Asal Geografis",     hijau: "Asia Tenggara",             biru: "Asia Selatan" },
  { label: "Status Konservasi",  hijau: "Endangered (IUCN)",         biru: "Least Concern (IUCN)" },
  { label: "Ciri Fisik Utama",   hijau: "Bulu hijau keemasan",       biru: "Bulu biru metalik" },
  { label: "Ukuran Tubuh",       hijau: "180–250 cm (panjang total)", biru: "100–115 cm (tanpa ekor)" },
  { label: "Habitat Alami",      hijau: "Hutan tropis dataran rendah", biru: "Hutan sekunder & perbukitan" },
  { label: "Populasi Liar",      hijau: "± 10.000–20.000 ekor",      biru: "Stabil, tersebar luas" },
  { label: "Masa Inkubasi",      hijau: "±28 hari",                  biru: "±28 hari" },
  { label: "Suhu Ideal",         hijau: "37.5°C – 38.0°C",          biru: "37.5°C – 38.0°C" },
  { label: "Kelembaban Ideal",   hijau: "45% – 50%",                 biru: "45% – 50%" },
  { label: "Candling Pertama",   hijau: "Hari ke-7 s.d. ke-10",      biru: "Hari ke-7 s.d. ke-10" },
];

// ========================
// Role Definitions
// ========================
export const ROLES = {
  admin: {
    label: "Pemilik / Admin Utama",
    short: "Admin",
    desc: "Akses penuh untuk monitoring, kontrol, konfigurasi, akun, data telur, kamera CCTV, dan histori.",
    allowed: ["dashboard", "kamera", "telur", "katalog", "histori", "pengaturan", "akun", "penjualan"],
    canControl: true,
    canConfigure: true,
    canEditEggs: true,
    canManagePeafowl: false,
    canManageSales: true,
    canManageUsers: true,
    canAcknowledge: true,
    canViewBusinessAnalytics: true,
  },
  operator: {
    label: "Operator / Teknisi Inkubator",
    short: "Operator",
    desc: "Dapat mengelola operasional telur, CCTV, histori, dan kontrol perangkat. Tidak dapat mengelola akun.",
    allowed: ["dashboard", "kamera", "telur", "katalog", "histori", "pengaturan"],
    canControl: true,
    canConfigure: false,
    canEditEggs: true,
    canManagePeafowl: false,
    canManageSales: false,
    canManageUsers: false,
    canAcknowledge: true,
    canViewBusinessAnalytics: false,
  },
  viewer: {
    label: "Viewer / Peneliti / Tamu",
    short: "Viewer",
    desc: "Akses pemantauan saja (dashboard, CCTV, dan data telur). Semua tombol kontrol dikunci.",
    allowed: ["dashboard", "kamera", "telur", "katalog"],
    canControl: false,
    canConfigure: false,
    canEditEggs: false,
    canManagePeafowl: false,
    canManageSales: false,
    canManageUsers: false,
    canAcknowledge: false,
    canViewBusinessAnalytics: false,
  },
};

export const ROLE_ACCESS_CODES = {
  admin: import.meta.env.VITE_ADMIN_ACCESS_CODE || "KM-ADMIN-2026",
  operator: import.meta.env.VITE_OPERATOR_ACCESS_CODE || "KM-OPERATOR-2026",
};

// ========================
// Default / Initial Data
// ========================
export const DEFAULT_TREND = [
  37.4, 37.5, 37.6, 37.8, 37.7, 37.9, 37.8, 37.6, 37.7, 37.8, 38.0, 37.9, 37.7, 37.6, 37.8, 37.9,
  37.8, 37.7, 37.6, 37.8, 37.9, 37.8, 37.7, 37.8,
];

export const INITIAL_EGGS = [
  {
    id: "EGG-2026-001", incubatorId: "INK-A", slot: 1, tanggalBertelur: "2026-06-01",
    tanggalMasuk: "2026-06-02", estimasiMenetas: "2026-06-30", fertilitas: "fertil",
    akhir: "proses", varietas: "Merak Hijau", indukJantanId: "MRK-JTN-001",
    indukBetinaId: "MRK-BTN-001", catatan: "Kondisi awal baik",
  },
  {
    id: "EGG-2026-002", incubatorId: "INK-A", slot: 2, tanggalBertelur: "2026-06-01",
    tanggalMasuk: "2026-06-02", estimasiMenetas: "2026-06-30", fertilitas: "fertil",
    akhir: "proses", varietas: "Merak Hijau", indukJantanId: "MRK-JTN-001",
    indukBetinaId: "MRK-BTN-001", catatan: "Posisi stabil",
  },
  {
    id: "EGG-2026-003", incubatorId: "INK-A", slot: 3, tanggalBertelur: "2026-06-02",
    tanggalMasuk: "2026-06-03", estimasiMenetas: "2026-07-01", fertilitas: "belum dicek",
    akhir: "proses", varietas: "Merak Hijau", indukJantanId: "MRK-JTN-001",
    indukBetinaId: "MRK-BTN-001", catatan: "Menunggu candling",
  },
  {
    id: "EGG-2026-004", incubatorId: "INK-A", slot: 4, tanggalBertelur: "2026-06-02",
    tanggalMasuk: "2026-06-03", estimasiMenetas: "2026-07-01", fertilitas: "infertil",
    akhir: "gagal_tetas", varietas: "Merak Hijau", indukJantanId: "MRK-JTN-001",
    indukBetinaId: "MRK-BTN-001", catatan: "Dikeluarkan setelah inspeksi",
  },
  {
    id: "EGG-2026-005", incubatorId: "INK-A", slot: 5, tanggalBertelur: "2026-06-03",
    tanggalMasuk: "2026-06-04", estimasiMenetas: "2026-07-02", fertilitas: "fertil",
    akhir: "menetas", varietas: "Merak Biru", indukJantanId: "MRK-JTN-002",
    indukBetinaId: "MRK-BTN-002", anakId: "MRK-ANK-001", catatan: "Menetas normal",
  },
  {
    id: "EGG-2026-006", incubatorId: "INK-A", slot: 6, tanggalBertelur: "2026-06-04",
    tanggalMasuk: "2026-06-05", estimasiMenetas: "2026-07-03", fertilitas: "belum dicek",
    akhir: "proses", varietas: "Merak Biru", indukJantanId: "MRK-JTN-002",
    indukBetinaId: "MRK-BTN-002", catatan: "Menunggu candling",
  },
];

export const INITIAL_PEAFOWL = [
  {
    id: "MRK-JTN-001", nama: "Arjuna", jenisKelamin: "Jantan", varietas: "Merak Hijau",
    tanggalLahir: "2021-08-16", asal: "Indukan", ayahId: "", ibuId: "", eggId: "",
    kandang: "KDG-A", status: "Indukan", catatan: "Induk jantan utama batch hijau",
  },
  {
    id: "MRK-BTN-001", nama: "Saraswati", jenisKelamin: "Betina", varietas: "Merak Hijau",
    tanggalLahir: "2022-03-10", asal: "Indukan", ayahId: "", ibuId: "", eggId: "",
    kandang: "KDG-A", status: "Indukan", catatan: "Induk betina aktif",
  },
  {
    id: "MRK-JTN-002", nama: "Biru Langit", jenisKelamin: "Jantan", varietas: "Merak Biru",
    tanggalLahir: "2021-11-02", asal: "Indukan", ayahId: "", ibuId: "", eggId: "",
    kandang: "KDG-B", status: "Indukan", catatan: "Induk jantan batch biru",
  },
  {
    id: "MRK-BTN-002", nama: "Nilam", jenisKelamin: "Betina", varietas: "Merak Biru",
    tanggalLahir: "2022-05-25", asal: "Indukan", ayahId: "", ibuId: "", eggId: "",
    kandang: "KDG-B", status: "Indukan", catatan: "Induk betina batch biru",
  },
  {
    id: "MRK-ANK-001", nama: "Anakan B1-005", jenisKelamin: "Belum diketahui",
    varietas: "Merak Biru", tanggalLahir: "2026-07-02", asal: "Tetas Inkubator",
    ayahId: "MRK-JTN-002", ibuId: "MRK-BTN-002", eggId: "EGG-2026-005",
    kandang: "KDG-B-ANAK", status: "Anakan", catatan: "Anakan dari telur slot 5",
  },
];

export const INITIAL_SALES = [
  {
    id: "SALE-2026-001", tanggal: "2026-07-05", item: "Paket 5 Telur Merak Hijau",
    referensiId: "BATCH-EG-001", pembeli: "Royal Javanese Aviary", qty: 1,
    hargaSatuan: 4500000, status: "Lunas",
    catatan: "Sertifikat Lineage DCA diterbitkan",
  },
  {
    id: "SALE-2026-002", tanggal: "2026-07-08", item: "Paket 3 Telur Merak Biru",
    referensiId: "BATCH-EG-002", pembeli: "Aditya Santoso", qty: 1,
    hargaSatuan: 2400000, status: "DP",
    catatan: "Booking reservasi, penetasan via inkubator farm",
  },
];

export const INITIAL_USERS = [
  { uid: "USR-001", nama: "Pemilik Kampung Merak", role: "admin" },
  { uid: "USR-002", nama: "Teknisi Inkubator", role: "operator" },
  { uid: "USR-003", nama: "Peneliti Tamu", role: "viewer" },
];

export const INITIAL_ALERTS = [
  {
    id: "ALT-001", level: "Kritis", title: "Suhu melewati batas atas",
    source: "Sensor DHT22", createdAt: "2026-07-09 09:15", status: "open",
    acknowledgedBy: "",
    detail: "Suhu terbaca 38.4°C selama lebih dari 3 menit. Periksa lampu pemanas dan ventilasi.",
  },
  {
    id: "ALT-002", level: "Peringatan", title: "Kelembaban turun",
    source: "Humidifier", createdAt: "2026-07-09 10:40", status: "open",
    acknowledgedBy: "",
    detail: "Kelembaban berada di bawah 45%. Operator dapat memicu mist maker setelah pengecekan fisik.",
  },
  {
    id: "ALT-003", level: "Info", title: "Motor rak selesai berputar",
    source: "Stepper Rack", createdAt: "2026-07-09 12:00", status: "acknowledged",
    acknowledgedBy: "Operator",
    detail: "Putaran jadwal siang berhasil.",
  },
];

// ========================
// Utility functions
// ========================
export function makeId(prefix = "ID") {
  return `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

export function nowTime() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function formatNumber(value, fraction = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toFixed(fraction);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function normalizeStatus(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "ON" || normalized === "OFF") return normalized;
  return "UNKNOWN";
}

export function statusText(status) {
  return (
    {
      idle: "Belum Terhubung",
      connecting: "Menghubungkan",
      connected: "Terhubung",
      reconnecting: "Menghubungkan Ulang",
      offline: "Terputus",
      error: "Gangguan Koneksi",
    }[status] || "Belum Terhubung"
  );
}

export function getMonthKey(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
