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
    # Ambil data pesanan milik user ini dari yang paling baru
    orders = db.query(Order).filter(Order.customer_id == current_user.id).order_by(desc(Order.created_at)).all()
    
    result = []
    for order in orders:
        address = db.query(Address).filter(Address.id == order.address_id).first()
        
        # PERBAIKAN UTAMA: Ambil data paket secara langsung dari database berdasarkan package_id jika relasi lazy-load kosong
        package_data = order.package
        if not package_data and order.package_id:
            package_data = db.query(CateringPackage).filter(CateringPackage.id == order.package_id).first()
        
        order_data = {
            "id": order.id,
            "order_code": order.order_code,
            "quantity": order.quantity,
            "status": order.status,
            "created_at": order.created_at,
            # Sekarang dijamin membawa data objek paket asli (termasuk .name dan .price)
            "package": package_data, 
            "total_price": order.total_price,
            "payment_method": order.payment_method if hasattr(order, 'payment_method') else "cash",
            "lat": address.lat if address else None, 
            "lng": address.lng if address else None,
            "street": address.street if address else None,
            "notes": order.notes if hasattr(order, 'notes') else "",
            "scheduled_time": order.scheduled_time if hasattr(order, 'scheduled_time') else ""
        }
        result.append(order_data)

# 2. Membuat Pesanan Baru (Menerima Payload lengkap dari Checkout/OrderFood.jsx)
@router.post("/")
def create_order(payload: OrderCreateProd, db: Session = Depends(get_db)):
    try:
        created_orders = []
        if payload.order_items and len(payload.order_items) > 0:
            for item in payload.order_items:
                # Hitung harga spesifik untuk item ini (harga satuan x jumlah porsi)
                item_price = item.get("price_at_order", 0) * item.get("quantity", 1)
                
                new_order = Order(
                    order_code=payload.order_code,          # Semua menu disatukan oleh order_code yang sama
                    customer_id=payload.customer_id,
                    package_id=item.get("package_id"),      # ID menu spesifik
                    address_id=payload.address_id,
                    quantity=item.get("quantity", 1),
                    total_price=item_price,                 # Harga total khusus menu ini
                    scheduled_time=payload.scheduled_time,
                    status=payload.status,
                    notes=payload.notes,
                    payment_method=payload.payment_data.get("method") if payload.payment_data else "cash"
                )
                db.add(new_order)
                created_orders.append(new_order)
                
        # JIKA HANYA PESAN 1 MENU (FALLBACK / SINGLE ITEM)
        else:
            new_order = Order(
                order_code=payload.order_code,
                customer_id=payload.customer_id,
                package_id=payload.package_id,
                address_id=payload.address_id,
                quantity=payload.quantity,
                total_price=payload.total_price,
                scheduled_time=payload.scheduled_time,
                status=payload.status,
                notes=payload.notes,
                payment_method=payload.payment_data.get("method") if payload.payment_data else "cash"
            )
            db.add(new_order)
            created_orders.append(new_order)

        # Simpan semua baris menu ke dalam database MySQL sekaligus
        db.commit()
        # Refresh baris pertama untuk mengambil ID sebagai response
        db.refresh(created_orders[0])
        return {"status": "success", "order_id": created_orders[0].id, "message": f"{len(created_orders)} pesanan berhasil dibuat"}
    
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