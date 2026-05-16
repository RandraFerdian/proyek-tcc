from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(50), index=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) 
    package_id = Column(Integer, ForeignKey("catering_packages.id"), nullable=True) 
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    address_id = Column(Integer, nullable=True)
    
    quantity = Column(Integer, default=1, nullable=True)
    total_price = Column(Float, default=0.0, nullable=True)
    scheduled_time = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending", nullable=True)
    payment_method = Column(String(50), default="cash", nullable=True) 
    payment_status = Column(String(20), default="unpaid", nullable=True) 
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    package = relationship("CateringPackage", back_populates="orders")
    courier = relationship("Courier", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
