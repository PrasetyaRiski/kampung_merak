from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from ..models import Breeder, Egg, Chick, Fertilitas
from ..schemas import (
    BreederCreate, BreederResponse, BreederDetailResponse,
    BreederLineage, BreederCompareItem, BreederCompareResponse,
)
from ..auth import require_role

router = APIRouter(prefix="/api/breeders", tags=["Breeder"])


def get_breeder_performance(db: Session, breeder_id: str) -> dict:
    total_telur = db.query(func.count(Egg.id)).filter(
        (Egg.induk_jantan_id == breeder_id) | (Egg.induk_betina_id == breeder_id)
    ).scalar() or 0

    total_fertil = db.query(func.count(Egg.id)).filter(
        ((Egg.induk_jantan_id == breeder_id) | (Egg.induk_betina_id == breeder_id))
        & (Egg.fertilitas == Fertilitas.FERTIL)
    ).scalar() or 0

    total_cek = db.query(func.count(Egg.id)).filter(
        ((Egg.induk_jantan_id == breeder_id) | (Egg.induk_betina_id == breeder_id))
        & (Egg.fertilitas != Fertilitas.BELUM_DICEK)
    ).scalar() or 0

    persentase_fertil = (total_fertil / total_cek * 100) if total_cek > 0 else 0.0

    jumlah_anakan = db.query(func.count(Chick.id)).filter(
        (Chick.induk_jantan_id == breeder_id) | (Chick.induk_betina_id == breeder_id)
    ).scalar() or 0

    return {
        "total_telur": total_telur,
        "persentase_fertil": round(persentase_fertil, 1),
        "jumlah_anakan": jumlah_anakan,
    }


def breeder_to_detail(db: Session, breeder: Breeder) -> BreederDetailResponse:
    perf = get_breeder_performance(db, breeder.id)
    return BreederDetailResponse(
        **{c.name: getattr(breeder, c.name) for c in breeder.__table__.columns},
        **perf,
    )


@router.get("", response_model=List[BreederResponse])
def list_breeders(db: Session = Depends(get_db)):
    return db.query(Breeder).order_by(Breeder.created_at.desc()).all()


@router.get("/compare", response_model=BreederCompareResponse)
def compare_breeders(ids: str = Query(..., description="Pisah dengan koma, contoh: MRK-F0-001,MRK-F0-002"), db: Session = Depends(get_db)):
    id_list = [i.strip() for i in ids.split(",")]
    breeders = db.query(Breeder).filter(Breeder.id.in_(id_list)).all()
    if not breeders:
        raise HTTPException(status_code=404, detail="Tidak ada breeder ditemukan")

    items = []
    for b in breeders:
        perf = get_breeder_performance(db, b.id)
        items.append(BreederCompareItem(
            id=b.id, nama=b.nama, jenis_kelamin=b.jenis_kelamin.value if hasattr(b.jenis_kelamin, 'value') else b.jenis_kelamin,
            generasi=b.generasi, varian_warna=b.varian_warna, status=b.status.value if hasattr(b.status, 'value') else b.status,
            total_telur=perf["total_telur"], persentase_fertil=perf["persentase_fertil"], jumlah_anakan=perf["jumlah_anakan"],
        ))
    return BreederCompareResponse(breeders=items)


@router.get("/{breeder_id}", response_model=BreederDetailResponse)
def get_breeder(breeder_id: str, db: Session = Depends(get_db)):
    breeder = db.query(Breeder).filter(Breeder.id == breeder_id).first()
    if not breeder:
        raise HTTPException(status_code=404, detail="Breeder tidak ditemukan")
    return breeder_to_detail(db, breeder)


@router.get("/{breeder_id}/lineage", response_model=BreederLineage)
def get_breeder_lineage(breeder_id: str, db: Session = Depends(get_db)):
    breeder = db.query(Breeder).filter(Breeder.id == breeder_id).first()
    if not breeder:
        raise HTTPException(status_code=404, detail="Breeder tidak ditemukan")

    parent_jantan = None
    parent_betina = None

    if breeder.parent_jantan_id:
        pj = db.query(Breeder).filter(Breeder.id == breeder.parent_jantan_id).first()
        if pj:
            parent_jantan = breeder_to_detail(db, pj)

    if breeder.parent_betina_id:
        pb = db.query(Breeder).filter(Breeder.id == breeder.parent_betina_id).first()
        if pb:
            parent_betina = breeder_to_detail(db, pb)

    return BreederLineage(
        breeder=breeder_to_detail(db, breeder),
        parent_jantan=parent_jantan,
        parent_betina=parent_betina,
    )


@router.post("", response_model=BreederResponse, status_code=201)
def create_breeder(breeder_data: BreederCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    existing = db.query(Breeder).filter(Breeder.id == breeder_data.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID breeder sudah digunakan")
    breeder = Breeder(**breeder_data.model_dump())
    db.add(breeder)
    db.commit()
    db.refresh(breeder)
    return breeder


@router.put("/{breeder_id}", response_model=BreederResponse)
def update_breeder(breeder_id: str, breeder_data: BreederCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    breeder = db.query(Breeder).filter(Breeder.id == breeder_id).first()
    if not breeder:
        raise HTTPException(status_code=404, detail="Breeder tidak ditemukan")
    for key, value in breeder_data.model_dump().items():
        setattr(breeder, key, value)
    db.commit()
    db.refresh(breeder)
    return breeder


@router.delete("/{breeder_id}")
def delete_breeder(breeder_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    breeder = db.query(Breeder).filter(Breeder.id == breeder_id).first()
    if not breeder:
        raise HTTPException(status_code=404, detail="Breeder tidak ditemukan")

    ref_count = db.query(func.count(Egg.id)).filter(
        (Egg.induk_jantan_id == breeder_id) | (Egg.induk_betina_id == breeder_id)
    ).scalar() or 0
    if ref_count > 0:
        raise HTTPException(status_code=400, detail=f"Breeder masih memiliki {ref_count} data telur yang merujuk. Hapus telur terlebih dahulu.")

    child_count = db.query(func.count(Breeder.id)).filter(
        (Breeder.parent_jantan_id == breeder_id) | (Breeder.parent_betina_id == breeder_id)
    ).scalar() or 0
    if child_count > 0:
        raise HTTPException(status_code=400, detail=f"Breeder masih dirujuk sebagai induk oleh {child_count} breeder lain.")

    db.delete(breeder)
    db.commit()
    return {"message": f"Breeder {breeder_id} berhasil dihapus"}
