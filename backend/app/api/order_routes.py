from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import json

from ..database import get_db
from ..models.order_model import Order
from ..models.address_model import Address
from ..models.package_model import CateringPackage
from ..models.route_model import DeliveryRoute
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

class OrderStatusUpdate(BaseModel):
    status: str

class OrderCourierAssign(BaseModel):
    courier_id: int

def get_courier_location(order: Order, db: Session):
    if not order.courier_id:
        return None

    route = (
        db.query(DeliveryRoute)
        .filter(DeliveryRoute.courier_id == order.courier_id)
        .order_by(desc(DeliveryRoute.createdAt))
        .first()
    )
    if not route or not route.waypoints:
        return None

    try:
        location = json.loads(route.waypoints)
    except json.JSONDecodeError:
        return None

    return {
        "lat": location.get("lat"),
        "lng": location.get("lng"),
        "updated_at": location.get("updated_at"),
        "order_id": location.get("order_id"),
    }

def serialize_order(order: Order, db: Session):
    address = db.query(Address).filter(Address.id == order.address_id).first() if order.address_id else None
    package_data = order.package
    if not package_data and order.package_id:
        package_data = db.query(CateringPackage).filter(CateringPackage.id == order.package_id).first()

    return {
        "id": order.id,
        "order_code": order.order_code,
        "customer_id": order.customer_id,
        "customer": {
            "id": order.customer.id,
            "name": order.customer.name,
            "company": order.customer.company,
            "phone": order.customer.phone,
            "email": order.customer.email,
        } if order.customer else None,
        "package_id": order.package_id,
        "package": {
            "id": package_data.id,
            "package_name": package_data.package_name,
            "name": package_data.package_name,
            "price": package_data.price,
            "description": package_data.description,
            "menu_items": package_data.menu_items,
        } if package_data else None,
        "courier_id": order.courier_id,
        "courier": {
            "id": order.courier.id,
            "name": order.courier.name,
            "phone": order.courier.phone,
            "vehicle_plate": order.courier.vehicle_plate,
            "is_active": order.courier.is_active,
        } if order.courier else None,
        "address_id": order.address_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "scheduled_time": order.scheduled_time,
        "delivered_at": order.delivered_at,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "notes": order.notes,
        "created_at": order.created_at,
        "lat": address.lat if address else None,
        "lng": address.lng if address else None,
        "street": address.street if address else None,
        "address": {
            "id": address.id,
            "label": address.label,
            "street": address.street,
            "city": address.city,
            "lat": address.lat,
            "lng": address.lng,
        } if address else None,
        "courier_location": get_courier_location(order, db),
    }

@router.get("/")
def get_all_orders(customer_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Order)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)

    orders = query.order_by(desc(Order.created_at)).all()
    return [serialize_order(order, db) for order in orders]

@router.get("/courier/{courier_id}")
def get_courier_orders(courier_id: int, include_available: bool = True, db: Session = Depends(get_db)):
    query = db.query(Order)
    if include_available:
        query = query.filter((Order.courier_id == courier_id) | (Order.courier_id.is_(None)))
    else:
        query = query.filter(Order.courier_id == courier_id)

    orders = query.order_by(desc(Order.created_at)).all()
    return [serialize_order(order, db) for order in orders]

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
        
        # Serialize package data dengan benar agar nama menu tampil
        package_dict = None
        if package_data:
            package_dict = {
                "id": package_data.id,
                "name": package_data.package_name,  # Ambil dari attribute package_name
                "price": package_data.price,
                "description": package_data.description,
                "menu_items": package_data.menu_items
            }
        
        order_data = {
            "id": order.id,
            "order_code": order.order_code,
            "quantity": order.quantity,
            "status": order.status,
            "created_at": order.created_at,
            # Sekarang package dikirim sebagai dictionary dengan nama yang benar
            "package": package_dict, 
            "total_price": order.total_price,
            "payment_method": order.payment_method if hasattr(order, 'payment_method') else "cash",
            "lat": address.lat if address else None, 
            "lng": address.lng if address else None,
            "street": address.street if address else None,
            "notes": order.notes if hasattr(order, 'notes') else "",
            "scheduled_time": order.scheduled_time if hasattr(order, 'scheduled_time') else ""
        }
        result.append(order_data)
    
    return result

@router.get("/{order_id}")
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return serialize_order(order, db)

@router.put("/{order_id}/status")
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    order.status = payload.status
    if payload.status.lower() in ["selesai", "delivered"]:
        order.delivered_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return serialize_order(order, db)

@router.put("/{order_id}/assign-courier")
def assign_order_courier(order_id: int, payload: OrderCourierAssign, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    order.courier_id = payload.courier_id
    if not order.status or order.status.lower() == "pending":
        order.status = "dikirim"
    db.commit()
    db.refresh(order)
    return serialize_order(order, db)

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
