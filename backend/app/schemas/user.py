from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "admin"
    company_address: Optional[str] = None
    building_address: Optional[str] = None
    coordinates: Optional[str] = None

# Saat registrasi Admin baru, wajib kirim password mentah
class UserCreate(UserBase):
    password: str 

# Saat mengirim data ke Frontend, HANYA kolom ini yang dikirim (TIDAK ADA PASSWORD)
class UserOut(UserBase):
    id: int
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True