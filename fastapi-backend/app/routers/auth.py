from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, LoginRequest, TokenResponse
from ..auth import get_password_hash, verify_password, create_access_token, require_role, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, current_user: User = Depends(require_role("pemilik")), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    existing_id = db.query(User).filter(User.id == user_data.id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="ID user sudah digunakan")
    hashed = get_password_hash(user_data.password)
    user = User(
        id=user_data.id,
        email=user_data.email,
        hashed_password=hashed,
        nama=user_data.nama,
        role=user_data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    token = create_access_token(data={"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(require_role("pemilik", "staff"))):
    return current_user
