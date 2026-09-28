import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Chick, Egg, EggAkhir
from ..schemas import ChickCreate, ChickResponse
from ..auth import require_role

router = APIRouter(prefix="/api/chicks", tags=["Chick"])


def generate_chick_id(db: Session, egg_id: str) -> str:
    prefix = f"{egg_id}-C"
    existing = db.query(Chick.id).filter(Chick.id.like(f"{prefix}%")).all()
    nums = []
    for (eid,) in existing:
        m = re.search(r"-C(\d+)$", eid)
        if m:
            nums.append(int(m.group(1)))
    next_n = max(nums) + 1 if nums else 1
    return f"{prefix}{next_n:02d}"


@router.get("", response_model=List[ChickResponse])
def list_chicks(db: Session = Depends(get_db)):
    return db.query(Chick).order_by(Chick.tanggal_menetas.desc()).all()


@router.get("/{chick_id}", response_model=ChickResponse)
def get_chick(chick_id: str, db: Session = Depends(get_db)):
    chick = db.query(Chick).filter(Chick.id == chick_id).first()
    if not chick:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    return chick


@router.post("", response_model=ChickResponse, status_code=201)
def create_chick(chick_data: ChickCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    egg = db.query(Egg).filter(Egg.id == chick_data.egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur asal tidak ditemukan")

    data = chick_data.model_dump()
    chick_id = data.get("id")
    if not chick_id or not str(chick_id).strip():
        data["id"] = generate_chick_id(db, chick_data.egg_id)
    else:
        data["id"] = str(chick_id).strip()
        existing_id = db.query(Chick).filter(Chick.id == data["id"]).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="ID anakan sudah digunakan")

    data["induk_jantan_id"] = egg.induk_jantan_id
    data["induk_betina_id"] = egg.induk_betina_id

    chick = Chick(**data)
    egg.akhir = EggAkhir.MENETAS if hasattr(EggAkhir, 'MENETAS') else "Menetas"
    db.add(chick)
    db.commit()
    db.refresh(chick)
    return chick


@router.put("/{chick_id}", response_model=ChickResponse)
def update_chick(chick_id: str, chick_data: ChickCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    chick = db.query(Chick).filter(Chick.id == chick_id).first()
    if not chick:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    data = chick_data.model_dump()
    data.pop("id", None)
    for key, value in data.items():
        setattr(chick, key, value)
    db.commit()
    db.refresh(chick)
    return chick


@router.delete("/{chick_id}")
def delete_chick(chick_id: str, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    chick = db.query(Chick).filter(Chick.id == chick_id).first()
    if not chick:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    db.delete(chick)
    db.commit()
    return {"message": f"Anakan {chick_id} berhasil dihapus"}
