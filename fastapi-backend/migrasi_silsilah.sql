-- Migrasi silsilah ID: induk -> telur -> anak
-- Jalankan SEKALI di database server (MySQL). Aman diulang (IF NOT EXISTS tidak
-- tersedia untuk ADD COLUMN di semua versi, jadi cek manual bila perlu).
-- Tabel breeders/chicks dibuat otomatis oleh create_all backend.

-- 1. Kolom induk di tabel eggs (nullable agar data lama tetap valid)
ALTER TABLE eggs ADD COLUMN induk_jantan_id VARCHAR(50) NULL;
ALTER TABLE eggs ADD COLUMN induk_betina_id VARCHAR(50) NULL;

-- 2. Backfill opsional: isi induk dari catatan bila diketahui, contoh:
-- UPDATE eggs SET induk_jantan_id='JB01', induk_betina_id='BB01' WHERE id='EGG-001';

-- 3. Kolom display Breeder (nullable, data existing aman)
ALTER TABLE breeders ADD COLUMN generasi VARCHAR(20) NULL;
ALTER TABLE breeders ADD COLUMN varian_warna VARCHAR(100) NULL;
ALTER TABLE breeders ADD COLUMN status VARCHAR(50) NULL;
ALTER TABLE breeders ADD COLUMN foto_url VARCHAR(500) NULL;

-- 4. Kolom induk auto-isi di Chicks (read-only, diisi server saat create)
ALTER TABLE chicks ADD COLUMN induk_jantan_id VARCHAR(50) NULL;
ALTER TABLE chicks ADD COLUMN induk_betina_id VARCHAR(50) NULL;
