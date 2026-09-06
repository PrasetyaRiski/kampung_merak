from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import IncubatorSettings, IncubatorStatus, Alert, AlertTipe, AlertLevel
from ..schemas import (
    IncubatorSettingsBase, IncubatorSettingsResponse,
    IncubatorStatusCreate, IncubatorStatusResponse,
)
from ..auth import require_role

router = APIRouter(prefix="/api/incubator", tags=["Incubator"])


def check_and_create_alerts(db: Session, suhu: float, kelembapan: float):
    settings = db.query(IncubatorSettings).first()
    if not settings:
        return

    alerts_to_create = []

    if suhu < float(settings.suhu_min) or suhu > float(settings.suhu_max):
        level = AlertLevel.CRITICAL
        pesan = (f"Suhu {suhu}°C di luar range "
                 f"({settings.suhu_min}-{settings.suhu_max}°C)")
        alerts_to_create.append(Alert(tipe=AlertTipe.SUHU, pesan=pesan, level=level))

    if kelembapan < float(settings.kelembapan_min) or kelembapan > float(settings.kelembapan_max):
        level = AlertLevel.WARNING
        pesan = (f"Kelembapan {kelembapan}% di luar range "
                 f"({settings.kelembapan_min}-{settings.kelembapan_max}%)")
        alerts_to_create.append(Alert(tipe=AlertTipe.KELEMBAPAN, pesan=pesan, level=level))

    for alert in alerts_to_create:
        db.add(alert)

    if alerts_to_create:
        db.commit()


@router.get("/settings", response_model=IncubatorSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(IncubatorSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Pengaturan inkubator belum diinisialisasi")
    return settings


@router.put("/settings", response_model=IncubatorSettingsResponse)
def update_settings(
    settings_data: IncubatorSettingsBase,
    current_user=Depends(require_role("pemilik", "staff")),
    db: Session = Depends(get_db),
):
    settings = db.query(IncubatorSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Pengaturan inkubator belum diinisialisasi")
    for key, value in settings_data.model_dump().items():
        setattr(settings, key, value)
    settings.updated_by = current_user.id
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/status", response_model=IncubatorStatusResponse)
def get_latest_status(db: Session = Depends(get_db)):
    status = db.query(IncubatorStatus).order_by(IncubatorStatus.id.desc()).first()
    if not status:
        raise HTTPException(status_code=404, detail="Belum ada data status inkubator")
    return status


@router.post("/status", response_model=IncubatorStatusResponse, status_code=201)
def create_status(
    status_data: IncubatorStatusCreate,
    db: Session = Depends(get_db),
):
    new_status = IncubatorStatus(**status_data.model_dump())
    db.add(new_status)
    db.commit()
    db.refresh(new_status)

    check_and_create_alerts(db, status_data.suhu_sekarang, status_data.kelembapan_sekarang)

    return new_status
