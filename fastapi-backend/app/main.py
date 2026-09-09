import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

load_dotenv()

from .database import engine, Base, get_db
from . import models, schemas
from . import silsilah as S

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
    new_id = (egg.id or "").strip()
    if not new_id:
        # auto: {Jantan}{Betina}-{NN} per pasangan
        if not egg.induk_jantan_id or not egg.induk_betina_id:
            raise HTTPException(status_code=422, detail="ID kosong: sertakan induk_jantan_id dan induk_betina_id agar ID silsilah bisa dibuat")
        existing = [r[0] for r in db.query(models.Egg.id).filter(
            models.Egg.induk_jantan_id == egg.induk_jantan_id,
            models.Egg.induk_betina_id == egg.induk_betina_id).all()]
        nomor = S.next_nomor(existing, lambda i: S.nomor_anak(i, egg.induk_jantan_id, egg.induk_betina_id))
        for _ in range(100):
            cand = S.build_telur(egg.induk_jantan_id, egg.induk_betina_id, nomor)
            if not db.query(models.Egg).filter(models.Egg.id == cand).first():
                new_id = cand
                break
            nomor += 1
        if not new_id:
            raise HTTPException(status_code=500, detail="Gagal generate ID telur")
    else:
        # manual format baru: prefix harus cocok dengan induk
        p = S.prefix_telur(new_id)
        if p is not None and (p[0] != egg.induk_jantan_id or p[1] != egg.induk_betina_id):
            raise HTTPException(status_code=422, detail=f"ID telur harus diawali {egg.induk_jantan_id}{egg.induk_betina_id}-{{NN}}")
        if db.query(models.Egg).filter(models.Egg.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID telur sudah digunakan")
    data = egg.dict()
    data["id"] = new_id
    new_egg = models.Egg(**data)
    db.add(new_egg)
    db.commit()
    db.refresh(new_egg)
    return new_egg

@app.put("/api/eggs/{egg_id}", response_model=schemas.EggResponse)
def update_egg(egg_id: str, egg_data: schemas.EggCreate, db: Session = Depends(get_db)):
    db_egg = db.query(models.Egg).filter(models.Egg.id == egg_id).first()
    if not db_egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    # induk dikunci: tidak boleh diganti via update
    if egg_data.induk_jantan_id and egg_data.induk_jantan_id != (db_egg.induk_jantan_id or egg_data.induk_jantan_id):
        raise HTTPException(status_code=422, detail="Induk tidak bisa diganti. Hapus lalu buat telur baru.")
    if egg_data.induk_betina_id and egg_data.induk_betina_id != (db_egg.induk_betina_id or egg_data.induk_betina_id):
        raise HTTPException(status_code=422, detail="Induk tidak bisa diganti. Hapus lalu buat telur baru.")
    # rename: hanya suffix nomor yang boleh berubah
    new_id = (egg_data.id or "").strip() or egg_id
    if new_id != egg_id:
        try:
            S.cek_edit_telur(egg_id, new_id)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        if db.query(models.Egg).filter(models.Egg.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID telur baru sudah digunakan")
        if db.query(models.Chick).filter(models.Chick.egg_id == egg_id).count() > 0:
            raise HTTPException(status_code=400, detail="Telur sudah punya anakan. Nomor tidak bisa diubah.")
        db_egg.id = new_id
    for key, value in egg_data.dict().items():
        if key in ("id", "induk_jantan_id", "induk_betina_id") or value is None:
            continue
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

# --- BREEDERS ENDPOINTS (silsilah: JB01/BB01 F0, {Jantan}{Betina}-{NN} anak) ---

@app.get("/api/breeders", response_model=List[schemas.BreederResponse])
def read_breeders(db: Session = Depends(get_db)):
    return db.query(models.Breeder).all()

def _breeder_dict(b):
    return {"id": b.id, "nama": b.nama, "jenis_kelamin": b.jenis_kelamin,
            "generasi": b.generasi or "", "varian_warna": b.varian_warna or "",
            "status": b.status or "", "foto_url": b.foto_url,
            "parent_jantan_id": b.parent_jantan_id, "parent_betina_id": b.parent_betina_id,
            "catatan": b.catatan}

@app.get("/api/breeders/compare")
def compare_breeders(ids: str, db: Session = Depends(get_db)):
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    out = []
    for bid in id_list:
        b = db.query(models.Breeder).filter(models.Breeder.id == bid).first()
        if not b:
            continue
        telur = db.query(models.Egg).filter(
            (models.Egg.induk_jantan_id == bid) | (models.Egg.induk_betina_id == bid)).all()
        fertil = sum(1 for t in telur if (t.fertilitas or "").strip().lower() == "fertil")
        dicek = sum(1 for t in telur if (t.fertilitas or "").strip().lower() in ("fertil", "infertil"))
        egg_ids = [t.id for t in telur]
        anak = db.query(models.Chick).filter(models.Chick.egg_id.in_(egg_ids)).count() if egg_ids else 0
        out.append({"id": b.id, "nama": b.nama, "jenis_kelamin": b.jenis_kelamin,
                    "generasi": b.generasi or "", "varian_warna": b.varian_warna or "",
                    "status": b.status or "",
                    "total_telur": len(telur),
                    "persentase_fertil": round(fertil / dicek * 100, 1) if dicek else 0.0,
                    "jumlah_anakan": anak})
    return {"breeders": out}

@app.get("/api/breeders/{breeder_id}", response_model=schemas.BreederResponse)
def read_breeder(breeder_id: str, db: Session = Depends(get_db)):
    b = db.query(models.Breeder).filter(models.Breeder.id == breeder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Indukan tidak ditemukan")
    return b

@app.get("/api/breeders/{breeder_id}/lineage")
def breeder_lineage(breeder_id: str, db: Session = Depends(get_db)):
    b = db.query(models.Breeder).filter(models.Breeder.id == breeder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Indukan tidak ditemukan")
    pj = db.query(models.Breeder).filter(models.Breeder.id == b.parent_jantan_id).first() if b.parent_jantan_id else None
    pb = db.query(models.Breeder).filter(models.Breeder.id == b.parent_betina_id).first() if b.parent_betina_id else None
    return {"breeder": _breeder_dict(b),
            "parent_jantan": _breeder_dict(pj) if pj else None,
            "parent_betina": _breeder_dict(pb) if pb else None}

@app.post("/api/breeders", response_model=schemas.BreederResponse)
def create_breeder(b: schemas.BreederCreate, db: Session = Depends(get_db)):
    new_id = (b.id or "").strip()
    if not new_id:
        if not b.parent_jantan_id and not b.parent_betina_id:
            kode = "JB" if b.jenis_kelamin.strip().lower() == "jantan" else "BB"
            existing = [r[0] for r in db.query(models.Breeder.id).all()]
            nomor = S.next_nomor(existing, lambda i: S.nomor_f0(i, kode))
            for _ in range(200):
                cand = S.build_f0(b.jenis_kelamin, nomor)
                if not db.query(models.Breeder).filter(models.Breeder.id == cand).first():
                    new_id = cand
                    break
                nomor += 1
        else:
            existing = [r[0] for r in db.query(models.Breeder.id).filter(
                models.Breeder.parent_jantan_id == b.parent_jantan_id,
                models.Breeder.parent_betina_id == b.parent_betina_id).all()]
            nomor = S.next_nomor(existing, lambda i: S.nomor_anak(i, b.parent_jantan_id, b.parent_betina_id))
            for _ in range(200):
                cand = S.build_telur(b.parent_jantan_id, b.parent_betina_id, nomor)
                if not db.query(models.Breeder).filter(models.Breeder.id == cand).first():
                    new_id = cand
                    break
                nomor += 1
        if not new_id:
            raise HTTPException(status_code=500, detail="Gagal generate ID indukan")
    else:
        if S.RE_F0.match(new_id):
            kode = "JB" if b.jenis_kelamin.strip().lower() == "jantan" else "BB"
            if not new_id.startswith(kode):
                raise HTTPException(status_code=422, detail=f"ID jantan harus JB, betina BB (contoh {kode}01)")
        elif S.prefix_telur(new_id) is not None and b.parent_jantan_id and b.parent_betina_id:
            p = S.prefix_telur(new_id)
            if p[0] != b.parent_jantan_id or p[1] != b.parent_betina_id:
                raise HTTPException(status_code=422, detail="ID indukan harus diawali {parent_jantan}{parent_betina}-{NN}")
        if db.query(models.Breeder).filter(models.Breeder.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID indukan sudah digunakan")
    data = b.dict()
    data["id"] = new_id
    nb = models.Breeder(**data)
    db.add(nb)
    db.commit()
    db.refresh(nb)
    return nb

@app.put("/api/breeders/{breeder_id}", response_model=schemas.BreederResponse)
def update_breeder(breeder_id: str, b_data: schemas.BreederCreate, db: Session = Depends(get_db)):
    b = db.query(models.Breeder).filter(models.Breeder.id == breeder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Indukan tidak ditemukan")
    # jenis kelamin & parent dikunci
    for f in ("jenis_kelamin", "parent_jantan_id", "parent_betina_id"):
        v = getattr(b_data, f)
        if v is not None and v != getattr(b, f):
            raise HTTPException(status_code=422, detail="Jenis kelamin/parent tidak bisa diganti.")
    new_id = (b_data.id or "").strip() or breeder_id
    if new_id != breeder_id:
        try:
            S.cek_edit_breeder(breeder_id, new_id)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        if db.query(models.Breeder).filter(models.Breeder.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID baru sudah digunakan")
        turun = (db.query(models.Egg).filter((models.Egg.induk_jantan_id == breeder_id) | (models.Egg.induk_betina_id == breeder_id)).count()
                 + db.query(models.Chick).filter((models.Chick.egg_id == breeder_id)).count()
                 + db.query(models.Breeder).filter((models.Breeder.parent_jantan_id == breeder_id) | (models.Breeder.parent_betina_id == breeder_id)).count())
        if turun > 0:
            raise HTTPException(status_code=400, detail="Indukan sudah punya turunan. Nomor tidak bisa diubah.")
        b.id = new_id
    for key, value in b_data.dict().items():
        if key in ("id", "jenis_kelamin", "parent_jantan_id", "parent_betina_id") or value is None:
            continue
        setattr(b, key, value)
    db.commit()
    db.refresh(b)
    return b

@app.delete("/api/breeders/{breeder_id}")
def delete_breeder(breeder_id: str, db: Session = Depends(get_db)):
    b = db.query(models.Breeder).filter(models.Breeder.id == breeder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Indukan tidak ditemukan")
    db.delete(b)
    db.commit()
    return {"message": f"Indukan {breeder_id} berhasil dihapus"}

# --- CHICKS ENDPOINTS (silsilah: {ID_Telur}-C{NN}) ---

@app.get("/api/chicks", response_model=List[schemas.ChickResponse])
def read_chicks(db: Session = Depends(get_db)):
    return db.query(models.Chick).all()

@app.get("/api/chicks/{chick_id}", response_model=schemas.ChickResponse)
def read_chick(chick_id: str, db: Session = Depends(get_db)):
    c = db.query(models.Chick).filter(models.Chick.id == chick_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    return c

@app.post("/api/chicks", response_model=schemas.ChickResponse)
def create_chick(c: schemas.ChickCreate, db: Session = Depends(get_db)):
    egg = db.query(models.Egg).filter(models.Egg.id == c.egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur asal tidak ditemukan")
    new_id = (c.id or "").strip()
    if not new_id:
        existing = [r[0] for r in db.query(models.Chick.id).filter(models.Chick.egg_id == c.egg_id).all()]
        nomor = S.next_nomor(existing, lambda i: S.nomor_chick(i, c.egg_id))
        for _ in range(100):
            cand = S.build_chick(c.egg_id, nomor)
            if not db.query(models.Chick).filter(models.Chick.id == cand).first():
                new_id = cand
                break
            nomor += 1
        if not new_id:
            raise HTTPException(status_code=500, detail="Gagal generate ID anakan")
    else:
        p = S.prefix_chick(new_id)
        if p is not None and p != c.egg_id:
            raise HTTPException(status_code=422, detail=f"ID anakan harus diawali {c.egg_id}-C{{NN}}")
        if db.query(models.Chick).filter(models.Chick.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID anakan sudah digunakan")
    data = c.dict()
    data["id"] = new_id
    data["induk_jantan_id"] = egg.induk_jantan_id
    data["induk_betina_id"] = egg.induk_betina_id
    nc = models.Chick(**data)
    db.add(nc)
    db.commit()
    db.refresh(nc)
    return nc

@app.put("/api/chicks/{chick_id}", response_model=schemas.ChickResponse)
def update_chick(chick_id: str, c_data: schemas.ChickCreate, db: Session = Depends(get_db)):
    c = db.query(models.Chick).filter(models.Chick.id == chick_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    if c_data.egg_id != c.egg_id:
        raise HTTPException(status_code=422, detail="Telur asal tidak bisa diganti.")
    new_id = (c_data.id or "").strip() or chick_id
    if new_id != chick_id:
        try:
            S.cek_edit_chick(chick_id, new_id)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        if db.query(models.Chick).filter(models.Chick.id == new_id).first():
            raise HTTPException(status_code=400, detail="ID baru sudah digunakan")
        c.id = new_id
    for key, value in c_data.dict().items():
        if key in ("id", "egg_id") or value is None:
            continue
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/api/chicks/{chick_id}")
def delete_chick(chick_id: str, db: Session = Depends(get_db)):
    c = db.query(models.Chick).filter(models.Chick.id == chick_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    db.delete(c)
    db.commit()
    return {"message": f"Anakan {chick_id} berhasil dihapus"}

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

# Threshold inkubator (in-memory; pindah ke DB bila butuh persistensi antar-restart)
THRESHOLD = {
    "suhu_min": 37.0, "suhu_max": 38.0,
    "kelembapan_min": 55.0, "kelembapan_max": 65.0,
    "interval_rotasi_menit": 240,
}

@app.get("/api/incubator/settings", response_model=schemas.IncubatorSettingsResponse)
def get_incubator_settings():
    """
    Superset: konfigurasi MQTT terpusat (frontend tidak perlu rebuild .env)
    + threshold inkubator.
    """
    return {
        "mqtt_url": os.getenv("MQTT_URL", "wss://9170ac9caae04bc598c6d6111adfa4a1.s1.eu.hivemq.cloud:8884/mqtt"),
        "mqtt_username": os.getenv("MQTT_USERNAME", "endoqmerak"),
        "mqtt_password": os.getenv("MQTT_PASSWORD", "Admin123"),
        "status": "online",
        **THRESHOLD,
    }

@app.put("/api/incubator/settings", response_model=schemas.IncubatorSettingsResponse)
def update_incubator_settings(data: schemas.IncubatorSettingsUpdate):
    for key, value in data.dict().items():
        if value is not None:
            THRESHOLD[key] = value
    return get_incubator_settings()
