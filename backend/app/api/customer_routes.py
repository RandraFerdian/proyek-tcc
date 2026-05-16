from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional 
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.customer_model import Customer 

# TAMBAHKAN create_access_token PADA IMPORT INI:
from ..core.security import get_password_hash, create_access_token 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/auth/customer", tags=["Customer Auth"])

# 1. Skema Pydantic Pembaca Request dari Form Frontend
class CustomerRegisterRequest(BaseModel):
    name: str
    company: Optional[str] = None 
    phone: str
    email: EmailStr 
    password: str

class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    existing_customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")
    
    hashed_password = get_password_hash(payload.password) 
    
    new_customer = Customer(
        name=payload.name,
        company=payload.company,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hashed_password 
    )

    try:
        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)
        return {"status": "success", "message": "Customer berhasil didaftarkan", "id": new_customer.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan ke database: {str(e)}")

@router.post("/login")
def login_customer(payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    # A. Cari customer berdasarkan email di tabel MySQL
    customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Email atau password salah!")

    # B. Verifikasi password yang diketik dengan hash password yang ada di DB
    if not pwd_context.verify(payload.password, customer.hashed_password):
        raise HTTPException(status_code=400, detail="Email atau password salah!")

    # C. BUAT TOKEN JWT ASLI! (Menyisipkan email customer ke dalam payload token)
    # Ini akan sempurna dibaca oleh get_current_customer di security.py
    access_token = create_access_token(data={"sub": customer.email})

    return {
        "access_token": access_token,
        "token": access_token,
        "role": "user", 
        "user_id": customer.id,
        "name": customer.name
    }