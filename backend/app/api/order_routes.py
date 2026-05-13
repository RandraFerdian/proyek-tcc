from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.order import Order
from ..schemas.order import OrderCreate, OrderOut
from pydantic import BaseModel
from ..services.firebase_service import log_delivery_event_to_nosql

router = APIRouter(prefix="/orders", tags=["Orders"])

# 1. Mendapatkan semua daftar pesanan
@router.get("/", response_model=list[OrderOut])
def get_all_orders(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.all()


# 2. Membuat pesanan baru
@router.post("/", response_model=OrderOut)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # order.model_dump() mengubah data dari Pydantic menjadi dictionary (JSON)
    new_order = Order(**order.model_dump())
    
    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal membuat pesanan: {str(e)}")

# 3. Mendapatkan detail pesanan berdasarkan ID (Opsional, tapi sangat berguna)
@router.get("/{order_id}", response_model=OrderOut)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return order

class OrderStatusUpdate(BaseModel):
    status: str
    location: Optional[dict] = None

# --- UPDATE STATUS & TRIGGER FIREBASE ---
@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, status_data: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    
    # Update di MySQL
    setattr(order, "status", status_data.status)
    db.commit()
    db.refresh(order)
    
    # Push ke Firebase (Untuk Live Tracking di Map)
    log_delivery_event_to_nosql(
        order_id=order_id, 
        status=status_data.status, 
        location=status_data.location
    )
    
    return order

# --- DELETE ORDER ---
@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    
    db.delete(order)
    db.commit()
    return {"message": f"Pesanan dengan ID {order_id} berhasil dihapus"}