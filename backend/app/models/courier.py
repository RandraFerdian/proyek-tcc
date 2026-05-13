from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    vehicle_plate = Column(String(20), nullable=True)
    vehicle_type = Column(String(50), nullable=True) 
    is_active = Column(Boolean, default=True)
    
    # Petakan variabel createdAt agar sesuai Pydantic, tetapi menunjuk kolom created_at di DB
    createdAt = Column("created_at", DateTime, default=func.now())
    
    # Relasi dikembalikan agar tidak terjadi error Mapper
    routes = relationship("DeliveryRoute", back_populates="courier")
    orders = relationship("Order", back_populates="courier")