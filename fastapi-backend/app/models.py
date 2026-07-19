from sqlalchemy import Column, Integer, String, Date, Numeric, Text
from .database import Base

class Egg(Base):
    __tablename__ = "eggs"

    id = Column(String(50), primary_key=True, index=True)
    slot = Column(Integer, unique=True, index=True, nullable=False)
    tanggalMasuk = Column(String(50), nullable=False) # Store as ISO date string to match client-side JS format
    fertilitas = Column(String(50), default="Belum dicek") # Fertil, Infertil, Belum dicek
    akhir = Column(String(50), default="Proses") # Menetas, Gagal, Proses
    catatan = Column(Text, nullable=True)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(50), primary_key=True, index=True)
    tanggal = Column(String(50), nullable=False) # Store as ISO date string
    item = Column(String(255), nullable=False)
    referensiId = Column(String(100), nullable=False) # ID Batch/Egg
    pembeli = Column(String(255), nullable=False)
    qty = Column(Integer, default=1, nullable=False)
    hargaSatuan = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), default="Booking") # Booking, DP, Lunas
    catatan = Column(Text, nullable=True)

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), nullable=False)
    temperature = Column(Numeric(5, 2), nullable=False)
    humidity = Column(Numeric(5, 2), nullable=False)
