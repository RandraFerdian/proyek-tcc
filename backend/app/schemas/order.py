from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .package import PackageOut  # <-- Import ini

class OrderBase(BaseModel):
    order_code: Optional[str] = None
    customer_id: Optional[int] = None
    package_id: Optional[int] = None
    courier_id: Optional[int] = None
    address_id: Optional[int] = None
    quantity: Optional[int] = 1
    total_price: Optional[float] = 0.0
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = "pending"
    payment_method: Optional[str] = "cash"
    payment_status: Optional[str] = "unpaid"
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass


class OrderOut(OrderBase):
    id: int
    delivered_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    # --- TAMBAHAN PENTING ---
    # Meminta FastAPI untuk ikut mengirim data paketnya ke Frontend
    package: Optional[PackageOut] = None

    class Config:
        from_attributes = True