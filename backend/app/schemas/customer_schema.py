from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Base schema untuk membaca data JSON (dari Frontend/Postman)
class CustomerBase(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# Schema khusus saat membuat customer baru (misal: Register)
class CustomerCreate(CustomerBase):
    password: str


# Schema khusus saat mengembalikan data ke Frontend (Response)
class CustomerOut(CustomerBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True