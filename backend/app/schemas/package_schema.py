from pydantic import BaseModel
from typing import Optional

class PackageBase(BaseModel):
    package_name: str
    type: str = "Makanan Berat"
    description: Optional[str] = None
    price: float

class PackageCreate(PackageBase):
    pass

class PackageOut(PackageBase):
    id: int
    class Config:
        from_attributes = True
