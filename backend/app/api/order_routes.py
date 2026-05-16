from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models.order_model import Order
from ..models.address_model import Address
from ..core.security import get_current_customer 

router = APIRouter(prefix="/orders", tags=["Orders"])

# --- SKEMA PRODUCTION READY ---
# Dibuat fleksibel (Optional) agar frontend tidak terblokir Error 422
class OrderCreateProd(BaseModel):
    order_code: str
    customer_id: int
    package_id: Optional[int] = None
    address_id: int
    quantity: Optional[int] = 1
    total_price: float
    scheduled_time: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = ""
    payment_data: Optional[Dict[str, Any]] = None
    order_items: Optional[List[Dict[str, Any]]] = None

# 1. Mendapatkan Pesanan & Nama Produk untuk ditampilkan di MyOrders React
@router.get("/me")
def get_my_orders(db: Session = Depends(get_db), current_user = Depends(get_current_customer)):
    # Ambil data pesanan dari yang paling baru
    orders = db.query(Order).filter(Order.customer_id == current_user.id).order_by(desc(Order.created_at)).all()
    
    result = []
    for order in orders:
        address = db.query(Address).filter(Address.id == order.address_id).first()
        
        order_data = {
            "id": order.id,
            "order_code": order.order_code,
            "quantity": order.quantity,
            "status": order.status,
            "created_at": order.created_at,
            # MEMBAWA NAMA PAKET AGAR BISA DIBACA OLEH FRONTEND
            "package": order.package, 
            "total_price": order.total_price,
            "payment_method": order.payment_method if hasattr(order, 'payment_method') else "cash",
            "lat": address.lat if address else None, 
            "lng": address.lng if address else None,
            "street": address.street if address else None,
        }
        result.append(order_data)
        
    return result

# 2. Membuat Pesanan Baru (Menerima Payload lengkap dari Checkout/OrderFood.jsx)
@router.post("/")
def create_order(payload: OrderCreateProd, db: Session = Depends(get_db)):
    try:
        new_order = Order(
            order_code=payload.order_code,
            customer_id=payload.customer_id,
            package_id=payload.package_id,
            address_id=payload.address_id,
            quantity=payload.quantity,
            total_price=payload.total_price,
            status=payload.status,
            notes=payload.notes,
            # Menangkap metode pembayaran jika order model memilikinya
            payment_method=payload.payment_data.get("method") if payload.payment_data else "cash"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        return {"status": "success", "order_id": new_order.id, "message": "Pesanan terbuat"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal memproses pesanan: {str(e)}")

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        db.delete(order)
        db.commit()
    return {"message": "Pesanan Dihapus"}