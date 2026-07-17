from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import FinanceEntry
from ..schemas import FinanceCreate, FinanceResponse
from ..auth import require_role

router = APIRouter(prefix="/api/finance", tags=["Finance"])


@router.get("", response_model=List[FinanceResponse])
def list_finance(current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    return db.query(FinanceEntry).order_by(FinanceEntry.tanggal.desc()).all()


@router.get("/{finance_id}", response_model=FinanceResponse)
def get_finance(finance_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == finance_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Data keuangan tidak ditemukan")
    return entry


@router.post("", response_model=FinanceResponse, status_code=201)
def create_finance(finance_data: FinanceCreate, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    entry = FinanceEntry(**finance_data.model_dump(), created_by=current_user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{finance_id}", response_model=FinanceResponse)
def update_finance(finance_id: str, finance_data: FinanceCreate, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == finance_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Data keuangan tidak ditemukan")
    for key, value in finance_data.model_dump().items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{finance_id}")
def delete_finance(finance_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == finance_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Data keuangan tidak ditemukan")
    db.delete(entry)
    db.commit()
    return {"message": f"Data keuangan {finance_id} berhasil dihapus"}
