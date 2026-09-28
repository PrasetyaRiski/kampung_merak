import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Egg
from ..schemas import EggCreate, EggResponse
from ..auth import require_role

router = APIRouter(prefix="/api/eggs", tags=["Egg"])


def generate_egg_id(db: Session, induk_jantan_id: Optional[str] = None, induk_betina_id: Optional[str] = None) -> str:
    ij = str(induk_jantan_id).strip() if induk_jantan_id else ""
    ib = str(induk_betina_id).strip() if induk_betina_id else ""
    if ij and ib:
        prefix = f"{ij}{ib}-"
        existing = db.query(Egg.id).filter(Egg.id.like(f"{prefix}%")).all()
        nums = []
        for (eid,) in existing:
            m = re.search(r"-(\d+)$", eid)
            if m:
                nums.append(int(m.group(1)))
        next_n = max(nums) + 1 if nums else 1
        return f"{prefix}{next_n:02d}"
    else:
        prefix = "EGG-"
        existing = db.query(Egg.id).filter(Egg.id.like("EGG-%")).all()
        nums = []
        for (eid,) in existing:
            m = re.search(r"EGG-(\d+)$", eid)
            if m:
                nums.append(int(m.group(1)))
        next_n = max(nums) + 1 if nums else 1
        return f"EGG-{next_n:03d}"


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

    data = egg_data.model_dump()
    egg_id = data.get("id")
    if not egg_id or not str(egg_id).strip():
        data["id"] = generate_egg_id(db, data.get("induk_jantan_id"), data.get("induk_betina_id"))
    else:
        data["id"] = str(egg_id).strip()
        existing_id = db.query(Egg).filter(Egg.id == data["id"]).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="ID telur sudah digunakan")

    if not data.get("induk_jantan_id") or not str(data["induk_jantan_id"]).strip():
        data["induk_jantan_id"] = None
    if not data.get("induk_betina_id") or not str(data["induk_betina_id"]).strip():
        data["induk_betina_id"] = None

    egg = Egg(**data)
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
    data = egg_data.model_dump()
    data.pop("id", None)
    if not data.get("induk_jantan_id") or not str(data["induk_jantan_id"]).strip():
        data["induk_jantan_id"] = None
    if not data.get("induk_betina_id") or not str(data["induk_betina_id"]).strip():
        data["induk_betina_id"] = None
    for key, value in data.items():
        setattr(egg, key, value)
    db.commit()
    db.refresh(egg)
    return egg


@router.delete("/{egg_id}")
def delete_egg(egg_id: str, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    egg = db.query(Egg).filter(Egg.id == egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur tidak ditemukan")
    db.delete(egg)
    db.commit()
    return {"message": f"Telur {egg_id} berhasil dihapus"}
