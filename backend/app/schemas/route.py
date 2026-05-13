from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RouteBase(BaseModel):
    courier_id: int
    route_date: datetime
    total_stops: Optional[int] = 0

class RouteCreate(RouteBase):
    pass

class RouteOut(RouteBase):
    id: int
    
    class Config:
        from_attributes = True