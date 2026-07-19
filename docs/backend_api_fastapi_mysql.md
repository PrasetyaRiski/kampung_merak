# Cetak Biru API Backend: Python (FastAPI) + MySQL

Dokumen ini berisi spesifikasi teknis, arsitektur, dan contoh kode untuk membangun server REST API terpisah menggunakan **Python (FastAPI)** dan database **MySQL** untuk inkubator Kampung Merak.

---

## 1. Arsitektur Hubungan Sistem

```mermaid
graph TD
    ReactWeb[React Web Browser] -- HTTP REST API / JSON --> FastAPI[FastAPI Backend Server]
    MobileApp[Flutter / Native Mobile App] -- HTTP REST API / JSON --> FastAPI
    FastAPI -- SQL Queries --> MySQL[(MySQL Database)]
    ESP32[ESP32 Inkubator] -- Telemetry / MQTT --> HiveMQ{HiveMQ Broker}
    ReactWeb -- Live MQTT WS --> HiveMQ
    MobileApp -- Live MQTT TCP --> HiveMQ
```

---

## 2. Struktur Proyek Backend (Terpisah)

Disarankan membuat folder proyek baru bernama `kampung-merak-backend` dengan struktur berikut:

```txt
kampung-merak-backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Entry point FastAPI & konfigurasi CORS
│   ├── database.py      # Koneksi database & SQLAlchemy Session
│   ├── models.py        # Skema tabel database (SQLAlchemy)
│   ├── schemas.py       # Validasi tipe data input/output (Pydantic)
│   └── crud.py          # Fungsi Create, Read, Update, Delete ke MySQL
├── .env                 # Environment variables (DB_URL)
└── requirements.txt     # Library Python yang dibutuhkan
```

---

## 3. Instalasi Dependensi (`requirements.txt`)

```txt
fastapi>=0.80.0
uvicorn>=0.15.0
sqlalchemy>=1.4.0
pymysql>=1.0.2
pydantic>=1.9.0
python-dotenv>=0.19.0
```

Instalasi menggunakan pip:
```bash
pip install -r requirements.txt
```

---

## 4. Contoh Implementasi Kode Utama

### A. Konfigurasi Database (`app/database.py`)
```python
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Format koneksi MySQL: mysql+pymysql://user:password@host:port/database_name
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/kampung_merak")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency untuk mendapatkan DB Session di endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### B. Definisi Model Database (`app/models.py`)
```python
from sqlalchemy import Column, Integer, String, Date, Numeric, Text
from .database import Base

class Egg(Base):
    __tablename__ = "eggs"

    id = Column(String(50), primary_key=True, index=True)
    slot = Column(Integer, unique=True, index=True, nullable=False)
    tanggalMasuk = Column(Date, nullable=False)
    fertilitas = Column(String(50), default="Belum dicek") # Fertil, Infertil, Belum dicek
    akhir = Column(String(50), default="Proses") # Menetas, Gagal Tetas, Proses
    catatan = Column(Text, nullable=True)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(50), primary_key=True, index=True)
    tanggal = Column(Date, nullable=False)
    item = Column(String(255), nullable=False)
    referensiId = Column(String(100), nullable=False) # ID Batch telur
    pembeli = Column(String(255), nullable=False)
    qty = Column(Integer, default=1, nullable=False)
    hargaSatuan = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), default="Booking") # Booking, DP, Lunas
    catatan = Column(Text, nullable=True)
```

---

### C. Validasi Skema Pydantic (`app/schemas.py`)
```python
from pydantic import BaseModel
from datetime import date
from typing import Optional

# --- SCHEMAS TELUR ---
class EggBase(BaseModel):
    slot: int
    tanggalMasuk: date
    fertilitas: str
    akhir: str
    catatan: Optional[str] = None

class EggCreate(EggBase):
    id: str

class EggResponse(EggBase):
    id: str

    class Config:
        orm_mode = True

# --- SCHEMAS PENJUALAN ---
class SaleBase(BaseModel):
    tanggal: date
    item: str
    referensiId: str
    pembeli: str
    qty: int
    hargaSatuan: float
    status: str
    catatan: Optional[str] = None

class SaleCreate(SaleBase):
    id: str

class SaleResponse(SaleBase):
    id: str

    class Config:
        orm_mode = True
```

---

### D. File Entry Point (`app/main.py`)
```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud

# Buat tabel otomatis jika belum ada di MySQL
Base.metadata.create_engine(bind=engine)

app = FastAPI(title="Kampung Merak API", version="1.0.0")

# Aktifkan CORS agar Web React (Port 5173/lainnya) bisa mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan domain web Anda pada saat production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS DATA TELUR ---

@app.get("/api/eggs", response_model=List[schemas.ResponseEgg])
def read_eggs(db: Session = Depends(get_db)):
    return db.query(models.Egg).all()

@app.post("/api/eggs", response_model=schemas.ResponseEgg)
def create_egg(egg: schemas.EggCreate, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.slot == egg.slot).first()
    if db_egg:
        raise HTTPException(status_code=400, detail="Slot sudah terisi")
    new_egg = models.Egg(**egg.dict())
    db.add(new_egg)
    db.commit()
    db.refresh(new_egg)
    return new_egg

@app.put("/api/eggs/{egg_id}", response_model=schemas.ResponseEgg)
def update_egg(egg_id: str, egg_data: schemas.EggBase, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.id == egg_id).first()
    if not db_egg:
        raise HTTPException(status_code=444, detail="Telur tidak ditemukan")
    for key, value in egg_data.dict().items():
        setattr(db_egg, key, value)
    db.commit()
    db.refresh(db_egg)
    return db_egg

@app.delete("/api/eggs/{egg_id}")
def delete_egg(egg_id: str, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.id == egg_id).first()
    if not db_egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    db.delete(db_egg)
    db.commit()
    return {"message": f"Data telur {egg_id} berhasil dihapus"}

# --- ENDPOINTS PENJUALAN ---

@app.get("/api/sales", response_model=List[schemas.SaleResponse])
def read_sales(db: Session = Depends(get_db)):
    return db.query(models.Sale).order_by(models.Sale.tanggal.desc()).all()

@app.post("/api/sales", response_model=schemas.SaleResponse)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    new_sale = models.Sale(**sale.dict())
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale
```

---

## 5. Menjalankan Server Backend

Gunakan server **Uvicorn** untuk menjalankan program FastAPI Anda:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server Anda akan aktif di alamat `http://<IP_Server>:8000`. Dokumentasi interaktif siap pakai (Swagger UI) dapat langsung diakses di browser pada url `http://<IP_Server>:8000/docs`.
