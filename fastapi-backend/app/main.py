import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

load_dotenv()

from .database import engine, Base, get_db
from . import models, schemas

# Create tables in MySQL if not exist (gracefully handle if DB is offline at startup)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Peringatan: Gagal inisialisasi tabel database ({e}). Pastikan MySQL berjalan.")

app = FastAPI(title="Kampung Merak API", version="1.0.0")

# Enable CORS so React frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EGGS ENDPOINTS ---

@app.get("/api/eggs", response_model=List[schemas.EggResponse])
def read_eggs(db: Session = Depends(get_db)):
    return db.query(models.Egg).all()

@app.post("/api/eggs", response_model=schemas.EggResponse)
def create_egg(egg: schemas.EggCreate, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.slot == egg.slot).first()
    if db_egg:
        raise HTTPException(status_code=400, detail="Slot sudah terisi")
    new_egg = models.Egg(**egg.dict())
    db.add(new_egg)
    db.commit()
    db.refresh(new_egg)
    return new_egg

@app.put("/api/eggs/{egg_id}", response_model=schemas.EggResponse)
def update_egg(egg_id: str, egg_data: schemas.EggBase, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.id == egg_id).first()
    if not db_egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
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

# --- SALES ENDPOINTS ---

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

@app.put("/api/sales/{sale_id}", response_model=schemas.SaleResponse)
def update_sale(sale_id: str, sale_data: schemas.SaleBase, db: Session = Depends(get_db)):
    db_sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    for key, value in sale_data.dict().items():
        setattr(db_sale, key, value)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: str, db: Session = Depends(get_db)):
    db_sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    db.delete(db_sale)
    db.commit()
    return {"message": f"Transaksi {sale_id} berhasil dihapus"}

# --- TELEMETRY ENDPOINTS ---

@app.get("/api/telemetry", response_model=List[schemas.TelemetryLogResponse])
def read_telemetry_logs(db: Session = Depends(get_db)):
    # Returns the 100 most recent telemetry records
    return db.query(models.TelemetryLog).order_by(models.TelemetryLog.id.desc()).limit(100).all()

@app.post("/api/telemetry", response_model=schemas.TelemetryLogResponse)
def create_telemetry_log(log: schemas.TelemetryLogBase, db: Session = Depends(get_db)):
    new_log = models.TelemetryLog(**log.dict())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

# --- SYSTEM & SETTINGS ENDPOINTS ---

@app.get("/api/incubator/settings", response_model=schemas.IncubatorSettingsResponse)
def get_incubator_settings():
    """
    Menyediakan konfigurasi MQTT terpusat untuk frontend,
    sehingga frontend tidak perlu dikompilasi ulang atau membongkar file .env saat deploy.
    """
    return {
        "mqtt_url": os.getenv("MQTT_URL", "wss://9170ac9caae04bc598c6d6111adfa4a1.s1.eu.hivemq.cloud:8884/mqtt"),
        "mqtt_username": os.getenv("MQTT_USERNAME", "endoqmerak"),
        "mqtt_password": os.getenv("MQTT_PASSWORD", "Admin123"),
        "status": "online"
    }
