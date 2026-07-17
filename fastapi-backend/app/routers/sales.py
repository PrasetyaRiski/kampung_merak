from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Sale
from ..schemas import SaleCreate, SaleResponse
from ..auth import require_role

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("", response_model=List[SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.tanggal.desc()).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return sale


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(sale_data: SaleCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    sale = Sale(**sale_data.model_dump())
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(sale_id: str, sale_data: SaleCreate, current_user=Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    for key, value in sale_data.model_dump().items():
        setattr(sale, key, value)
    db.commit()
    db.refresh(sale)
    return sale


@router.delete("/{sale_id}")
def delete_sale(sale_id: str, current_user=Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    db.delete(sale)
    db.commit()
    return {"message": f"Transaksi {sale_id} berhasil dihapus"}
