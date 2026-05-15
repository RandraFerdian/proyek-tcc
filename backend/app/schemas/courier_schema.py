from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    is_active: Optional[bool] = True

class CourierCreate(CourierBase):
    pass

class CourierOut(CourierBase):
    id: int
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True