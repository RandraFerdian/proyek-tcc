from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from ..database import Base

class Employees(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    
    # --- DUA KOLOM BARU UNTUK LOGIN & OTORISASI ---
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(50), default="admin") 
    
    phone = Column(String(255), nullable=True)
    company_address = Column(Text, nullable=True)
    building_address = Column(String(255), nullable=True)
    coordinates = Column(Text, nullable=True)
    
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)