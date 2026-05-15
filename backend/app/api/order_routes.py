from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models.order_model import Order
from ..models.address_model import Address # <-- Import model address yang baru dibuat
from ..core.security import get_current_customer 
from ..schemas.order_schema import OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])

# --- PAYLOAD KUSTOM UNTUK CHECKOUT ---
class OrderCheckoutPayload(BaseModel):
    customer_id: int
    package_id: int
    quantity: int
    status: str
    payment_method: str
    notes: str
    street: str
    lat: float
    lng: float

# 1. Mendapatkan pesanan dan lokasinya untuk ditampilkan di Map User
@router.get("/me")
def get_my_orders(db: Session = Depends(get_db), current_user = Depends(get_current_customer)):
    orders = db.query(Order).filter(Order.customer_id == current_user.id).all()
    
    result = []
    for order in orders:
        # Ambil data alamat dari tabel addresses berdasarkan address_id di order
        address = db.query(Address).filter(Address.id == order.address_id).first()
        
        # Hitung total harga
        price_per_package = order.package.price if order.package else 0
        total_p = order.total_price if order.total_price else (price_per_package * order.quantity)

        order_data = {
            "id": order.id,
            "quantity": order.quantity,
            "status": order.status,
            "created_at": order.created_at,
            "package": order.package,
            "total_price": total_p,
            "payment_method": order.payment_method,
            # Ambil koordinat dari tabel addresses
            "lat": address.lat if address else None, 
            "lng": address.lng if address else None,
        }
        result.append(order_data)
        
    return result

# 2. Membuat Pesanan Baru (Sekaligus menyimpan Alamat)
@router.post("/")
def create_order(payload: OrderCheckoutPayload, db: Session = Depends(get_db)):
    try:
        # STEP A: Simpan Alamat ke tabel addresses
        new_address = Address(
            customer_id=payload.customer_id,
            street=payload.street,
            lat=payload.lat,
            lng=payload.lng
        )
        db.add(new_address)
        db.flush() # Gunakan flush agar kita bisa langsung mendapatkan new_address.id
        
        # STEP B: Buat pesanan di tabel orders menggunakan address_id tersebut
        new_order = Order(
            customer_id=payload.customer_id,
            package_id=payload.package_id,
            quantity=payload.quantity,
            total_price=0, # Akan dihitung di frontend/me
            status=payload.status,
            payment_method=payload.payment_method,
            notes=payload.notes,
            address_id=new_address.id # <-- Hubungkan pesanan dengan alamat
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal memproses pesanan: {str(e)}")

# Endpoint lain dibiarkan kosong untuk disesuaikan kebutuhan
@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        db.delete(order)
        db.commit()
    return {"message": "Dihapus"}