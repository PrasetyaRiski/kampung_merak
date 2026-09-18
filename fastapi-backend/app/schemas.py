from pydantic import BaseModel
from typing import Optional

# --- SCHEMAS TELUR ---
class EggBase(BaseModel):
    slot: int
    induk_jantan_id: Optional[str] = None # silsilah: prefix ID (wajib untuk ID format baru)
    induk_betina_id: Optional[str] = None # silsilah: prefix ID (wajib untuk ID format baru)
    tanggalMasuk: str
    fertilitas: str
    akhir: str
    catatan: Optional[str] = None

class EggCreate(EggBase):
    id: Optional[str] = None # kosong = server generate {Jantan}{Betina}-{NN}

class EggResponse(EggBase):
    id: str

    class Config:
        orm_mode = True

# --- SCHEMAS INDUKAN (silsilah: JB01/BB01 untuk F0, {Jantan}{Betina}-{NN} untuk anak) ---
class BreederBase(BaseModel):
    nama: Optional[str] = None
    jenis_kelamin: str # jantan | betina
    parent_jantan_id: Optional[str] = None # null untuk F0
    parent_betina_id: Optional[str] = None # null untuk F0
    generasi: Optional[str] = None # display: F0, F1, ...
    varian_warna: Optional[str] = None # display
    status: Optional[str] = None # display
    foto_url: Optional[str] = None # display
    catatan: Optional[str] = None

class BreederCreate(BreederBase):
    id: Optional[str] = None # kosong = server generate

class BreederResponse(BreederBase):
    id: str

    class Config:
        orm_mode = True

# --- SCHEMAS ANAKAN (silsilah: {ID_Telur}-C{NN}) ---
class ChickBase(BaseModel):
    egg_id: str # dikunci: tidak boleh diganti saat update
    tanggal_menetas: str
    status: str = "newborn"
    catatan: Optional[str] = None

class ChickCreate(ChickBase):
    id: Optional[str] = None # kosong = server generate {egg_id}-C{NN}

class ChickResponse(ChickBase):
    id: str
    induk_jantan_id: Optional[str] = None # auto-isi dari egg (read-only)
    induk_betina_id: Optional[str] = None # auto-isi dari egg (read-only)

    class Config:
        orm_mode = True

# --- SCHEMAS PENJUALAN ---
class SaleBase(BaseModel):
    tanggal: str
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

# --- SCHEMAS TELEMETRI ---
class TelemetryLogBase(BaseModel):
    timestamp: str
    temperature: float
    humidity: float

class TelemetryLogResponse(TelemetryLogBase):
    id: int

    class Config:
        orm_mode = True

# --- SCHEMAS SETTINGS / MQTT + THRESHOLD (superset) ---
class IncubatorSettingsResponse(BaseModel):
    mqtt_url: str
    mqtt_username: Optional[str] = None
    mqtt_password: Optional[str] = None
    status: str = "online"
    suhu_min: float = 37.0
    suhu_max: float = 38.0
    kelembapan_min: float = 55.0
    kelembapan_max: float = 65.0
    interval_rotasi_menit: int = 240

class IncubatorSettingsUpdate(BaseModel):
    suhu_min: Optional[float] = None
    suhu_max: Optional[float] = None
    kelembapan_min: Optional[float] = None
    kelembapan_max: Optional[float] = None
    interval_rotasi_menit: Optional[int] = None
