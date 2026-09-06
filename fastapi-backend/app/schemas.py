from pydantic import BaseModel
from typing import Optional

# --- SCHEMAS TELUR ---
class EggBase(BaseModel):
    slot: int
    tanggalMasuk: str
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

# --- SCHEMAS SETTINGS / MQTT ---
class IncubatorSettingsResponse(BaseModel):
    mqtt_url: str
    mqtt_username: Optional[str] = None
    mqtt_password: Optional[str] = None
    status: str = "online"
