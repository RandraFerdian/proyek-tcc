from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from ..database import get_db
from ..models.user import User
from ..models.customer import Customer
from ..core.security import create_access_token, verify_password
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), role_hint: str = "user", db: Session = Depends(get_db)):
    user = None
    role = role_hint
    if role_hint == "admin":
        user = db.query(User).filter(User.email == form_data.username).first()
    else:
        user = db.query(Customer).filter(Customer.email == form_data.username).first()
    if not user:
        if role_hint == "admin":
            user = db.query(Customer).filter(Customer.email == form_data.username).first()
            role = "user"
        else:
            user = db.query(User).filter(User.email == form_data.username).first()
            role = "admin"
    if not user:
        raise HTTPException(status_code=400, detail="Email tidak terdaftar")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Password salah")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "id": user.id, "role": role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "role": role
    }