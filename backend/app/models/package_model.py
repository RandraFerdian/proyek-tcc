from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class CateringPackage(Base):
    __tablename__ = "catering_packages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Petakan package_name ke kolom name di DB
    package_name = Column("name", String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    menu_items = Column(Text, nullable=True)
    
    createdAt = Column("created_at", DateTime, default=func.now())

    # Relationship untuk order
    orders = relationship("Order", back_populates="package")