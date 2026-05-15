from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    
    # Petakan variabel created_at agar sesuai dengan MySQL
    created_at = Column(DateTime, default=func.now())
    
    # Opsional: Jika kamu ingin bisa menarik data pesanan langsung dari data customer
    orders = relationship("Order", back_populates="customer")