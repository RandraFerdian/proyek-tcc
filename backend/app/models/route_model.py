from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class DeliveryRoute(Base):
    __tablename__ = "delivery_routes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    route_date = Column(DateTime, nullable=True)
    
    # Menyesuaikan dengan struktur DB baru
    waypoints = Column(Text, nullable=True)
    total_distance = Column(Float, nullable=True)
    estimated_duration = Column(Integer, nullable=True)
    status = Column(String(20), nullable=True)
    
    createdAt = Column("created_at", DateTime, default=func.now())

    # Relationship
    courier = relationship("Courier", back_populates="routes")