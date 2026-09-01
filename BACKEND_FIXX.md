# Backend: Endpoint Bootstrap `POST /auth/seed-admin`

Dokumen ini untuk developer backend Kampung Merak API. Tujuannya: menambahkan
satu endpoint yang memungkinkan aplikasi mobile membuat user admin pertama
**tanpa** harus login terlebih dahulu.

## Konteks

Aplikasi mobile (Flutter) di `https://api-merak.abdulrosyid.my.id` saat ini
tidak bisa login karena:

1. Database `users` kosong (belum ada admin)
2. `POST /auth/login` butuh kredensial valid → 401
3. `POST /auth/register` ternyata **juga butuh JWT** → 401 chicken-and-egg

Endpoint `POST /auth/seed-admin` di bawah ini menyelesaikan chicken-and-egg
dengan aturan: **hanya aktif saat tabel `users` masih kosong**. Setelah user
pertama dibuat, endpoint otomatis return `410 Gone` dan tidak bisa dipakai lagi.

## Spesifikasi Endpoint

```
POST /auth/seed-admin
Headers:
  Content-Type: application/json
  X-API-Key: <required, sama dengan yang di mobile .env>

Body:
{
  "id": "admin01",
  "email": "admin@merak.id",
  "password": "GantiDenganPasswordKuat!",
  "nama": "Admin Kampung Merak",
  "role": "admin"
}

Response 201 Created (sukses, user pertama dibuat):
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "admin01",
    "email": "admin@merak.id",
    "nama": "Admin Kampung Merak",
    "role": "admin",
    "created_at": "2026-08-29T..."
  }
}

Response 410 Gone (user sudah ada):
{ "detail": "Bootstrap sudah nonaktif. User pertama sudah dibuat." }

Response 409 Conflict (email duplikat):
{ "detail": "Email sudah terdaftar" }

Response 401 Unauthorized (X-API-Key salah / tidak ada):
{ "detail": "X-API-Key tidak valid atau tidak disertakan" }

Response 422 Unprocessable Entity (validasi gagal):
{ "detail": [
    { "loc": ["body", "password"], "msg": "Password minimal 8 karakter", ... }
  ] }
```

### Aturan Validasi

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | 3-50 char, alphanumeric + dash, harus unik |
| `email` | string | Format email valid, harus unik |
| `password` | string | Minimal 8 karakter |
| `nama` | string | Minimal 2 karakter |
| `role` | string | Hanya `"admin"` atau `"owner"`. Default `"admin"` |

## Implementasi FastAPI

Asumsi struktur project backend (umum untuk FastAPI + SQLAlchemy):
```
app/
  main.py
  routers/
    auth.py
  schemas/
    auth.py          # atau schemas/user.py
  models/
    user.py
  core/
    security.py      # hash_password, create_access_token
    deps.py          # get_db, verify_api_key
```

Sesuaikan path import jika struktur Anda berbeda.

### 1. Schema: `app/schemas/auth.py`

Tambahkan di akhir file (atau buat file baru `app/schemas/seed.py`):

```python
from typing import Literal
from pydantic import BaseModel, Field, EmailStr


class SeedAdminRequest(BaseModel):
    id: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="ID unik user, alphanumeric + dash/underscore",
    )
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimal 8 karakter")
    nama: str = Field(..., min_length=2, max_length=100)
    role: Literal["admin", "owner"] = "admin"
```

### 2. Endpoint: `app/routers/auth.py`

Tambahkan route ini. **Letakkan sebelum** route `/auth/register` (atau di posisi
mana saja — yang penting path-nya `/auth/seed-admin`):

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, verify_api_key
from app.core.security import hash_password, create_access_token
from app.models.user import User
from app.schemas.auth import SeedAdminRequest, TokenResponse  # sesuaikan

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/seed-admin",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Seed admin pertama (hanya aktif jika tabel users kosong)",
    description=(
        "Endpoint bootstrap untuk membuat user admin pertama kali. "
        "Setelah user pertama dibuat, endpoint otomatis return 410 Gone."
    ),
)
def seed_admin(
    payload: SeedAdminRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_api_key),
) -> TokenResponse:
    # Guard 1: hanya boleh dipakai jika tabel users masih kosong
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Bootstrap sudah nonaktif. User pertama sudah dibuat.",
        )

    # Guard 2: email tidak boleh duplikat (defense in depth)
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email sudah terdaftar",
        )

    if db.query(User).filter(User.id == payload.id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ID user sudah dipakai",
        )

    # Buat user
    user = User(
        id=payload.id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        nama=payload.nama,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT token agar mobile bisa auto-login setelah seed
    token = create_access_token(
        data={"sub": user.id, "role": user.role}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )
```

### 3. (Opsional) Update OpenAPI Tags

Jika ingin endpoint muncul di grup tag sendiri di `/docs`:

```python
@router.post(
    "/seed-admin",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bootstrap"],   # pisah dari "Auth" agar jelas di docs
    summary="...",
)
def seed_admin(...): ...
```

## Verifikasi dengan curl

Ganti `PASSWORD_KUAT` dengan password yang aman:

```bash
curl -X POST https://api-merak.abdulrosyid.my.id/auth/seed-admin \
  -H "X-API-Key: a6aGc2JHHIu3A53S10Ypkzwf7nKgt18jkerto" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "admin01",
    "email": "admin@merak.id",
    "password": "PASSWORD_KUAT",
    "nama": "Admin Kampung Merak",
    "role": "admin"
  }'
```

**Harapannya:**
- Respons pertama (saat tabel users kosong): `201 Created` + JSON berisi `access_token` dan `user`
- Panggilan kedua (setelah user dibuat): `410 Gone` + `{"detail":"Bootstrap sudah nonaktif..."}`

Verifikasi tambahan — login manual harus bekerja setelah user dibuat:

```bash
curl -X POST https://api-merak.abdulrosyid.my.id/auth/login \
  -H "X-API-Key: a6aGc2JHHIu3A53S10Ypkzwf7nKgt18jkerto" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@merak.id","password":"PASSWORD_KUAT"}'
```

Harusnya return `200 OK` + `access_token`.

## Langkah Deploy

1. Pull branch dengan perubahan endpoint
2. Backend FastAPI biasanya auto-reload (uvicorn `--reload`). Kalau tidak, restart service:
   ```bash
   sudo systemctl restart merak-api
   # atau: pm2 restart merak-api
   # atau: docker restart <container>
   ```
3. Cek log: harus tidak ada error import
4. Tes endpoint dengan curl di atas
5. Konfirmasi ke tim mobile bahwa user sudah bisa login

## Verifikasi dari Aplikasi Mobile

1. Di project mobile, jalankan:
   ```bash
   cd /home/marimo/Desktop/mobile/merak
   flutter run
   ```
2. Buka layar login
3. Masukkan email & password yang sama dengan yang di-seed
4. **Yang diharapkan:**
   - Tidak ada SnackBar error
   - Redirect otomatis ke `/dashboard`
   - Data dashboard tampil (Chart, statistik telur, dll)
5. Buka tab "Inkubator" → data settings & status muncul
6. Buka menu "Manajemen User" → list user muncul (saat ini kosong karena cuma 1 user)

Jika masih error 401, lihat di log console mobile — akan ada blok:
```
╔══ DIO ERROR ══
║ METHOD   : POST
║ URL      : https://api-merak.../auth/login
║ STATUS   : 401
║ RESPONSE : {"detail":"Email atau password salah"}
╚═══════════════
```
Artinya: kredensial salah, atau user belum terbuat.

## Catatan Keamanan

1. **Endpoint ini harus auto-disable** — pendekatan "count == 0" sudah cukup
   untuk mencegah abuse. Jangan pernah expose endpoint yang selalu bisa bikin
   user baru tanpa auth.
2. **Tidak ada rate limit khusus** — karena endpoint hanya hidup sebentar
   (sampai user pertama dibuat), dan sudah diproteksi `X-API-Key`, ini cukup.
3. **Password wajib kuat** — minimal 8 char di schema. Untuk production,
   pertimbangkan tambah policy kompleksitas (huruf besar, angka, simbol).
4. **Hapus endpoint ini setelah user pertama dibuat?** — Tidak perlu, karena
   `410 Gone` sudah membuatnya tidak berguna. Tapi jika Anda ingin extra
   precaution, bisa tambahkan:
   ```python
   import os
   BOOTSTRAP_ENABLED = os.getenv("BOOTSTRAP_ENABLED", "true").lower() == "true"

   @router.post("/seed-admin", ...)
   def seed_admin(...):
       if not BOOTSTRAP_ENABLED:
           raise HTTPException(status_code=404, detail="Not Found")
       ...
   ```
   Lalu set `BOOTSTRAP_ENABLED=false` di `.env` production setelah seed sukses.

## FAQ

**Q: Kenapa tidak pakai `POST /auth/register` saja?**
A: `register` saat ini butuh JWT. Kami tidak bisa ubah itu tanpa migrasi data,
jadi endpoint terpisah untuk bootstrap lebih aman.

**Q: Bagaimana kalau ada kebutuhan membuat user tambahan nanti?**
A: Pakai `POST /api/users` (sudah ada di OpenAPI) setelah login sebagai admin.

**Q: Bisa dipakai untuk buat lebih dari satu admin di waktu bersamaan?**
A: Tidak. Race condition dijaga oleh `count > 0` — panggilan kedua akan
otomatis dapat `410 Gone`. Tapi untuk safety, pertimbangkan tambahkan
`SELECT ... FOR UPDATE` atau unique constraint di DB (saran: tambahkan
`UNIQUE` di kolom `id` dan `email` — biasanya sudah ada).

**Q: Apakah perlu migrasi DB / perubahan schema?**
A: Tidak. Endpoint ini pakai tabel `users` yang sudah ada.

---

**Setelah endpoint ini deployed dan user pertama berhasil dibuat, hubungi tim
mobile untuk verifikasi bahwa login dari aplikasi sudah bisa.**
