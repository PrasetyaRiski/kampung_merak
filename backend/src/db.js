import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "kampung-merak.db");

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS eggs (
      id TEXT PRIMARY KEY,
      incubator_id TEXT NOT NULL DEFAULT 'INK-A',
      slot INTEGER NOT NULL,
      tanggal_bertelur TEXT,
      tanggal_masuk TEXT NOT NULL,
      estimasi_menetas TEXT,
      fertilitas TEXT NOT NULL DEFAULT 'belum dicek',
      akhir TEXT NOT NULL DEFAULT 'proses',
      varietas TEXT NOT NULL,
      induk_jantan_id TEXT,
      induk_betina_id TEXT,
      anak_id TEXT,
      catatan TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS peafowl (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      jenis_kelamin TEXT NOT NULL DEFAULT 'Belum diketahui',
      varietas TEXT NOT NULL,
      tanggal_lahir TEXT,
      asal TEXT,
      ayah_id TEXT,
      ibu_id TEXT,
      egg_id TEXT,
      kandang TEXT,
      status TEXT NOT NULL DEFAULT 'Anakan',
      catatan TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      tanggal TEXT NOT NULL,
      item TEXT NOT NULL,
      referensi_id TEXT,
      pembeli TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      harga_satuan REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Booking',
      catatan TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT,
      created_at TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      acknowledged_by TEXT DEFAULT '',
      detail TEXT DEFAULT '',
      created_at_dt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
  if (count.cnt > 0) return;

  const insertUser = db.prepare("INSERT OR IGNORE INTO users (uid, nama, role, password_hash) VALUES (?, ?, ?, ?)");
  insertUser.run("USR-001", "Pemilik Kampung Merak", "admin", null);
  insertUser.run("USR-002", "Teknisi Inkubator", "operator", null);
  insertUser.run("USR-003", "Peneliti Tamu", "viewer", null);

  const insertEgg = db.prepare("INSERT OR IGNORE INTO eggs (id, slot, tanggal_masuk, estimasi_menetas, fertilitas, akhir, varietas, induk_jantan_id, induk_betina_id, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertEgg.run("EGG-2026-001", 1, "2026-06-02", "2026-06-30", "fertil", "proses", "Merak Hijau", "MRK-JTN-001", "MRK-BTN-001", "Kondisi awal baik");
  insertEgg.run("EGG-2026-002", 2, "2026-06-02", "2026-06-30", "fertil", "proses", "Merak Hijau", "MRK-JTN-001", "MRK-BTN-001", "Posisi stabil");
  insertEgg.run("EGG-2026-003", 3, "2026-06-03", "2026-07-01", "belum dicek", "proses", "Merak Hijau", "MRK-JTN-001", "MRK-BTN-001", "Menunggu candling");
  insertEgg.run("EGG-2026-004", 4, "2026-06-03", "2026-07-01", "infertil", "gagal_tetas", "Merak Hijau", "MRK-JTN-001", "MRK-BTN-001", "Dikeluarkan setelah inspeksi");
  insertEgg.run("EGG-2026-005", 5, "2026-06-04", "2026-07-02", "fertil", "menetas", "Merak Biru", "MRK-JTN-002", "MRK-BTN-002", "Menetas normal");
  insertEgg.run("EGG-2026-006", 6, "2026-06-05", "2026-07-03", "belum dicek", "proses", "Merak Biru", "MRK-JTN-002", "MRK-BTN-002", "Terpantau OpenCV");

  const insertBird = db.prepare("INSERT OR IGNORE INTO peafowl (id, nama, jenis_kelamin, varietas, tanggal_lahir, asal, ayah_id, ibu_id, egg_id, kandang, status, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertBird.run("MRK-JTN-001", "Arjuna", "Jantan", "Merak Hijau", "2021-08-16", "Indukan", "", "", "", "KDG-A", "Indukan", "Induk jantan utama batch hijau");
  insertBird.run("MRK-BTN-001", "Saraswati", "Betina", "Merak Hijau", "2022-03-10", "Indukan", "", "", "", "KDG-A", "Indukan", "Induk betina aktif");
  insertBird.run("MRK-JTN-002", "Biru Langit", "Jantan", "Merak Biru", "2021-11-02", "Indukan", "", "", "", "KDG-B", "Indukan", "Induk jantan batch biru");
  insertBird.run("MRK-BTN-002", "Nilam", "Betina", "Merak Biru", "2022-05-25", "Indukan", "", "", "", "KDG-B", "Indukan", "Induk betina batch biru");
  insertBird.run("MRK-ANK-001", "Anakan B1-005", "Belum diketahui", "Merak Biru", "2026-07-02", "Tetas Inkubator", "MRK-JTN-002", "MRK-BTN-002", "EGG-2026-005", "KDG-B-ANAK", "Anakan", "Anakan dari telur slot 5");

  const insertSale = db.prepare("INSERT OR IGNORE INTO sales (id, tanggal, item, referensi_id, pembeli, qty, harga_satuan, status, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertSale.run("SALE-2026-001", "2026-07-05", "Anakan Merak Biru", "MRK-ANK-001", "Investor Edufarm", 1, 7500000, "Booking", "DP diterima, serah terima setelah masa observasi");
  insertSale.run("SALE-2026-002", "2026-07-08", "Paket Kunjungan Peneliti", "KDG-A", "Tim Riset Kampus", 1, 1500000, "Lunas", "Akses viewer diberikan selama observasi");

  const insertAlert = db.prepare("INSERT OR IGNORE INTO alerts (id, level, title, source, created_at, status, detail) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertAlert.run("ALT-001", "Kritis", "Suhu melewati batas atas", "Sensor DHT22", "2026-07-09 09:15", "open", "Suhu terbaca 38.4°C selama lebih dari 3 menit. Periksa lampu pemanas dan ventilasi.");
  insertAlert.run("ALT-002", "Peringatan", "Kelembaban turun", "Humidifier", "2026-07-09 10:40", "open", "Kelembaban berada di bawah 45%. Operator dapat memicu mist maker setelah pengecekan fisik.");
  insertAlert.run("ALT-003", "Info", "Motor rak selesai berputar", "Stepper Rack", "2026-07-09 12:00", "acknowledged", "Putaran jadwal siang berhasil.");
}