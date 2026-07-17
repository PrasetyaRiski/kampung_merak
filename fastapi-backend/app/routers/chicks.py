from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Chick, Egg, EggAkhir
from ..schemas import ChickCreate, ChickResponse
from ..auth import require_role

router = APIRouter(prefix="/api/chicks", tags=["Chick"])


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
    existing_id = db.query(Chick).filter(Chick.id == chick_data.id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="ID anakan sudah digunakan")

    egg = db.query(Egg).filter(Egg.id == chick_data.egg_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Telur asal tidak ditemukan")

    chick = Chick(
        **chick_data.model_dump(),
        induk_jantan_id=egg.induk_jantan_id,
        induk_betina_id=egg.induk_betina_id,
    )
    egg.akhir = EggAkhir.MENETAS
    db.add(chick)
    db.commit()
    db.refresh(chick)
    return chick


@router.put("/{chick_id}", response_model=ChickResponse)
def update_chick(chick_id: str, chick_data: ChickCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    chick = db.query(Chick).filter(Chick.id == chick_id).first()
    if not chick:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    for key, value in chick_data.model_dump().items():
        setattr(chick, key, value)
    db.commit()
    db.refresh(chick)
    return chick


@router.delete("/{chick_id}")
def delete_chick(chick_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    chick = db.query(Chick).filter(Chick.id == chick_id).first()
    if not chick:
        raise HTTPException(status_code=404, detail="Anakan tidak ditemukan")
    db.delete(chick)
    db.commit()
    return {"message": f"Anakan {chick_id} berhasil dihapus"}
