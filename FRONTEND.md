# FRONTEND.md — Penyesuaian React terhadap Backend Silsilah

Dokumen ini mencatat penyesuaian aplikasi React (`src/`) agar selaras dengan backend silsilah ID (`fastapi-backend/`).

## 1. Format ID Silsilah (dibuat server)

| Entity | Format | Contoh |
|---|---|---|
| Breeder F0 | `JB{NN}` jantan / `BB{NN}` betina | `JB01`, `BB02` |
| Breeder anak & Telur | `{Jantan}{Betina}-{NN}` | `JB01BB02-01` |
| Anakan | `{ID_Telur}-C{NN}` | `JB01BB02-01-C01` |

ID lama (`MRK-*`, `EGG-*`, `CHK-*`) tetap diterima server (dilewati validasi prefix).

## 2. Kontrak Create (POST)

- **Jangan kirim `id`** — server generate otomatis per pasangan/per telur.
  - `POST /api/breeders`: tanpa `id`; F0 tanpa parent, anak sertakan `parent_jantan_id` + `parent_betina_id`.
  - `POST /api/eggs`: tanpa `id`; wajib `slot` + `induk_jantan_id` + `induk_betina_id`.
  - `POST /api/chicks`: tanpa `id`; wajib `egg_id` (induk auto-isi server).
- Yang sudah diubah di kode:
  - `src/pages/EggPage.jsx` — hapus `makeId("EGG")`, payload tanpa `id`.
  - `src/pages/ChicksPage.jsx` — hapus generate `CHK-xxx`, payload tanpa `id`.
  - `src/pages/BreedersPage.jsx` — hapus `generateBreederId`, payload tanpa `id`; info box "ID otomatis oleh server".

## 3. Kontrak Update (PUT)

- Field terkunci (prefix silsilah) **tidak boleh berubah** — input di-disable saat edit:
  - Breeder: `jenis_kelamin`, `parent_jantan_id`, `parent_betina_id`.
  - Egg: `induk_jantan_id`, `induk_betina_id`.
  - Chick: `egg_id`.
- Rename ID hanya suffix (`-01`→`-02`, `-C01`→`-C02`) via field `id` di body.
- Error yang ditampilkan (sudah via `alert`, pesan dari server):
  - `422` — prefix diganti (ganti induk/telur harus hapus + buat baru).
  - `400` — ID dipakai / objek sudah punya turunan.

## 4. Endpoint yang dipakai halaman

| Halaman | Endpoint |
|---|---|
| Breeders | `GET/POST /api/breeders`, `GET/PUT/DELETE /api/breeders/{id}`, `GET .../lineage`, `GET /api/breeders/compare?ids=A,B` |
| Eggs | `GET/POST /api/eggs`, `GET/PUT/DELETE /api/eggs/{id}` (+ `EggTray.jsx` read-only) |
| Chicks | `GET/POST /api/chicks`, `GET/PUT/DELETE /api/chicks/{id}` |
| Settings | `GET /api/incubator/settings` (superset: `mqtt_*` + threshold), `PUT` untuk threshold |

## 5. Catatan migrasi server

- Jalankan `fastapi-backend/migrasi_silsilah.sql` sekali di MySQL server (kolom baru nullable, data lama aman; tabel `breeders`/`chicks` auto-create).
- Field display baru: `breeders.generasi/varian_warna/status/foto_url`, `chicks.induk_*` (auto-isi) — nullable, modal lama tetap render.
