from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Alert, User
from ..schemas import AlertResponse
from ..auth import require_role

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(current_user: User = Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


@router.put("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(alert_id: int, current_user: User = Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert tidak ditemukan")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, current_user: User = Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert tidak ditemukan")
    db.delete(alert)
    db.commit()
    return {"message": f"Alert {alert_id} berhasil dihapus"}
