from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.courier_model import Courier
from ..schemas.courier_schema import CourierCreate, CourierOut

router = APIRouter(prefix="/couriers", tags=["Couriers"])

@router.get("/", response_model=list[CourierOut])
def get_all_couriers(db: Session = Depends(get_db)):
    return db.query(Courier).all()

@router.post("/", response_model=CourierOut)
def create_courier(courier: CourierCreate, db: Session = Depends(get_db)):
    new_courier = Courier(**courier.model_dump())
    db.add(new_courier)
    db.commit()
    db.refresh(new_courier)
    return new_courier

@router.put("/{courier_id}", response_model=CourierOut)
def update_courier(courier_id: int, courier_data: CourierCreate, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Kurir tidak ditemukan")
    
    for key, value in courier_data.model_dump().items():
        setattr(courier, key, value)
    
    db.commit()
    db.refresh(courier)
    return courier

@router.delete("/{courier_id}")
def delete_courier(courier_id: int, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Kurir tidak ditemukan")
    
    db.delete(courier)
    db.commit()
    return {"message": "Kurir berhasil dihapus"}
