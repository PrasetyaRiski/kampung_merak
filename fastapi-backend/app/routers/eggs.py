from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Egg
from ..schemas import EggCreate, EggResponse
from ..auth import require_role

router = APIRouter(prefix="/api/eggs", tags=["Egg"])


@router.get("", response_model=List[EggResponse])
def list_eggs(db: Session = Depends(get_db)):
    return db.query(Egg).all()


@router.get("/{egg_id}", response_model=EggResponse)
def get_egg(egg_id: str, db: Session = Depends(get_db)):
    egg = db.query(Egg).filter(Egg.id == egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    return egg


@router.post("", response_model=EggResponse, status_code=201)
def create_egg(egg_data: EggCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    existing_slot = db.query(Egg).filter(Egg.slot == egg_data.slot).first()
    if existing_slot:
        raise HTTPException(status_code=400, detail="Slot sudah terisi")
    existing_id = db.query(Egg).filter(Egg.id == egg_data.id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="ID telur sudah digunakan")
    egg = Egg(**egg_data.model_dump())
    db.add(egg)
    db.commit()
    db.refresh(egg)
    return egg


@router.put("/{egg_id}", response_model=EggResponse)
def update_egg(egg_id: str, egg_data: EggCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    egg = db.query(Egg).filter(Egg.id == egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    if egg_data.slot != egg.slot:
        slot_exists = db.query(Egg).filter(Egg.slot == egg_data.slot, Egg.id != egg_id).first()
        if slot_exists:
            raise HTTPException(status_code=400, detail="Slot sudah terisi")
    for key, value in egg_data.model_dump().items():
        setattr(egg, key, value)
    db.commit()
    db.refresh(egg)
    return egg


@router.delete("/{egg_id}")
def delete_egg(egg_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    egg = db.query(Egg).filter(Egg.id == egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    db.delete(egg)
    db.commit()
    return {"message": f"Telur {egg_id} berhasil dihapus"}
