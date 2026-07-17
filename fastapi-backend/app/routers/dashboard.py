from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Egg, Chick, IncubatorStatus, FinanceEntry, User
from ..schemas import DashboardSummary
from ..auth import require_role, get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(current_user: User = Depends(require_role("pemilik", "staff")), db: Session = Depends(get_db)):
    total_telur_aktif = db.query(func.count(Egg.id)).filter(
        Egg.akhir != "Menetas", Egg.akhir != "Gagal"
    ).scalar() or 0

    now = datetime.utcnow()
    bulan_ini = now.strftime("%Y-%m")
    total_anakan_bulan_ini = db.query(func.count(Chick.id)).filter(
        func.strftime("%Y-%m", Chick.tanggal_menetas) == bulan_ini
    ).scalar() or 0

    inkubator_status = db.query(IncubatorStatus).order_by(IncubatorStatus.id.desc()).first()

    finance_summary = None
    if current_user.role == "pemilik":
        pemasukan = db.query(func.sum(FinanceEntry.jumlah)).filter(
            FinanceEntry.tipe == "Pemasukan",
            func.strftime("%Y-%m", FinanceEntry.tanggal) == bulan_ini,
        ).scalar() or 0

        pengeluaran = db.query(func.sum(FinanceEntry.jumlah)).filter(
            FinanceEntry.tipe == "Pengeluaran",
            func.strftime("%Y-%m", FinanceEntry.tanggal) == bulan_ini,
        ).scalar() or 0

        finance_summary = {
            "total_pemasukan": float(pemasukan),
            "total_pengeluaran": float(pengeluaran),
            "saldo": float(pemasukan - pengeluaran),
        }

    return DashboardSummary(
        total_telur_aktif=total_telur_aktif,
        total_anakan_bulan_ini=total_anakan_bulan_ini,
        inkubator_status=inkubator_status,
        finance_summary=finance_summary,
    )
