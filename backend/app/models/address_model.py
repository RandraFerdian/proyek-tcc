from sqlalchemy import Column, Integer, String, Float, ForeignKey
from ..database import Base

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    label = Column(String(100), default="Lokasi Pengiriman")
    street = Column(String(255), nullable=True)
    city = Column(String(100), default="Yogyakarta")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)