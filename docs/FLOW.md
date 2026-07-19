# Flow Sistem Dashboard Inkubator Telur Merak


## 0. Flow Navigasi Sidebar

1. Sidebar selalu tampil tetap di sisi kiri dengan lebar 280 px.
2. Mode akses Admin, Operator, dan Viewer tersedia sebagai pilihan ceklis ringkas.
3. Menu halaman dibagi menjadi dua kelompok agar mudah dipindai tanpa menggulir dashboard utama.
4. Saat menu ditekan, React mengganti halaman aktif dan memperbarui hash URL, misalnya `#kamera` atau `#telur`.
5. Jika role tidak memiliki izin pada halaman tertentu, tombol menu tetap terlihat tetapi dikunci.

```txt
Sidebar → Pilih Role → Verifikasi jika perlu → Pilih Menu → Render Halaman Aktif
```

## 1. Flow Monitoring Sensor

1. ESP32 membaca sensor suhu dan kelembaban.
2. ESP32 mengirim payload teks ke broker MQTT.
3. Dashboard melakukan subscribe ke topik telemetri.
4. Nilai suhu dan kelembaban diperbarui pada kartu dashboard.
5. Grafik suhu 24 jam bergerak mengikuti pesan terbaru.
6. Log MQTT mencatat setiap pesan masuk.

```txt
Sensor ESP32 → Broker MQTT → MQTT.js Browser → State React → UI Dashboard
```

## 2. Flow Kontrol Perangkat

1. Admin atau operator menekan tombol kontrol.
2. Dashboard melakukan validasi hak akses.
3. Dashboard mengirim payload string ke topik perintah.
4. ESP32 menerima perintah melalui broker.
5. Perangkat keras merespons.
6. Status aktual ditunggu dari topik telemetri, bukan dipaksa berubah dari sisi UI.

```txt
UI Control → Validasi Role → Publish MQTT → ESP32 → Aktuator → Telemetri Status
```

## 3. Flow Kamera RTSP

1. Kamera Bardi atau kamera RTSP mengirim stream ke jaringan lokal.
2. Server Python OpenCV membaca RTSP.
3. Server mengubah stream menjadi MJPEG endpoint.
4. Dashboard menampilkan endpoint pada elemen `<img>`.
5. Jika endpoint gagal, placeholder error akan muncul.

```txt
Kamera RTSP → Python OpenCV → /video_feed → Browser Dashboard
```

## 4. Flow Data Telur

1. Operator atau admin memasukkan telur baru ke slot 1 sampai 100.
2. Sistem menyimpan data telur pada state lokal React.
3. Estimasi menetas dihitung otomatis dari tanggal masuk + 28 hari.
4. Hasil candling diperbarui menjadi fertil, infertil, atau belum dicek.
5. Status akhir diperbarui menjadi proses, menetas, gagal tetas, atau dibuang.
6. Viewer hanya dapat membaca data.

```txt
Input Telur → State React → Tabel Data → Visual Nampan 100 Slot
```

## 5. Flow Role Akses dan Verifikasi

1. Aplikasi dibuka dalam mode aman **Viewer**.
2. Pengguna memilih mode akses di sidebar menggunakan pilihan berbentuk ceklis.
3. Jika memilih **Admin** atau **Operator**, sistem menampilkan modal verifikasi.
4. Jika kode akses benar, role aktif dan hak akses dibuka sesuai peran.
5. Jika kode akses salah, role tidak berubah dan fitur kontrol tetap terkunci.
6. Viewer tidak memerlukan verifikasi dan tetap bersifat read-only.

```txt
Pilih Role → Viewer Langsung Aktif
Pilih Role → Admin/Operator → Modal Verifikasi → Kode Valid → Role Aktif
```

| Peran | Verifikasi | Kontrol Perangkat | Data Telur | Akun |
|---|---|---:|---:|---:|
| Admin | Wajib | Ya | Tambah/Edit | Ya |
| Operator | Wajib | Ya | Tambah/Edit | Tidak |
| Viewer | Tidak | Tidak | Lihat saja | Tidak |

## 6. Modul Aktif

- Dashboard Utama.
- Kamera CCTV.
- Data Telur.
- Histori Sensor.
- Pengaturan.
- Akun Pengguna.

## 7. Modul Tidak Digunakan

- Penangkaran merak.
- Data merak dewasa.
- Silsilah anakan.
- Penjualan.
- Analitik bisnis.
