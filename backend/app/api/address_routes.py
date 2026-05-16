from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db

# Pastikan import model Address kamu benar (sesuaikan dengan nama class di address_model.py)
from ..models.address_model import Address 

router = APIRouter(prefix="/addresses", tags=["Addresses"])

# Skema penangkap data dari frontend OrderFood.jsx
class AddressCreate(BaseModel):
    customer_id: int
    label: Optional[str] = "Rumah"
    street: str
    city: str
    lat: float
    lng: float

@router.post("/")
def create_address(payload: AddressCreate, db: Session = Depends(get_db)):
    try:
        new_address = Address(
            customer_id=payload.customer_id,
            label=payload.label,
            street=payload.street,
            city=payload.city,
            lat=payload.lat,
            lng=payload.lng
        )
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        
        # Harus mengembalikan id karena dibutuhkan oleh OrderFood.jsx (addrRes.data.id)
        return {"status": "success", "id": new_address.id, "message": "Alamat berhasil disimpan"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan alamat: {str(e)}")