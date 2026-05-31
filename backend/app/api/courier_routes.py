from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import json
from ..database import get_db
from ..models.courier_model import Courier
from ..models.route_model import DeliveryRoute
from ..schemas.courier_schema import CourierCreate, CourierOut
from ..core.security import create_access_token
from ..services import firebase_service

router = APIRouter(prefix="/couriers", tags=["Couriers"])

class CourierLoginRequest(BaseModel):
    phone: str
    vehicle_plate: str

class CourierLocationUpdate(BaseModel):
    lat: float
    lng: float
    order_id: int | None = None

@router.post("/login")
def login_courier(payload: CourierLoginRequest, db: Session = Depends(get_db)):
    normalized_plate = payload.vehicle_plate.replace(" ", "").lower()
    couriers = db.query(Courier).filter(Courier.phone == payload.phone).all()
    courier = next(
        (
            item
            for item in couriers
            if (item.vehicle_plate or "").replace(" ", "").lower() == normalized_plate
        ),
        None,
    )

    if not courier:
        raise HTTPException(status_code=400, detail="Nomor HP atau plat kendaraan salah")
    if courier.is_active is False:
        raise HTTPException(status_code=400, detail="Akun kurir sedang nonaktif")

    access_token = create_access_token(
        data={"sub": courier.phone, "id": courier.id, "role": "courier"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "courier",
        "courier_id": courier.id,
        "user_id": courier.id,
        "name": courier.name,
        "phone": courier.phone,
        "vehicle_plate": courier.vehicle_plate,
        "is_active": courier.is_active,
    }

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

@router.post("/{courier_id}/location")
def update_courier_location(courier_id: int, payload: CourierLocationUpdate, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Kurir tidak ditemukan")

    waypoint = {
        "lat": payload.lat,
        "lng": payload.lng,
        "order_id": payload.order_id,
        "updated_at": datetime.utcnow().isoformat(),
    }

    route = DeliveryRoute(
        courier_id=courier_id,
        route_date=datetime.utcnow(),
        waypoints=json.dumps(waypoint),
        status="active",
    )
    db.add(route)
    db.commit()
    db.refresh(route)

    # Integrasi Firebase NoSQL: Update lokasi kurir secara real-time
    if payload.order_id:
        firebase_service.update_courier_location(
            order_id=payload.order_id,
            courier_id=courier_id,
            latitude=payload.lat,
            longitude=payload.lng
        )

    return {"status": "success", "location": waypoint}
