from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.package_model import CateringPackage
from ..schemas.package_schema import PackageCreate, PackageOut

router = APIRouter(prefix="/packages", tags=["Catering Packages"])

@router.get("/", response_model=list[PackageOut])
def get_all_packages(db: Session = Depends(get_db)):
    return db.query(CateringPackage).all()

@router.post("/", response_model=PackageOut)
def create_package(package: PackageCreate, db: Session = Depends(get_db)):
    new_package = CateringPackage(**package.model_dump())
    db.add(new_package)
    db.commit()
    db.refresh(new_package)
    return new_package

@router.put("/{package_id}", response_model=PackageOut)
def update_package(package_id: int, package_data: PackageCreate, db: Session = Depends(get_db)):
    package = db.query(CateringPackage).filter(CateringPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paket tidak ditemukan")
    
    # Update fields
    setattr(package, 'package_name', package_data.package_name)
    setattr(package, 'type', package_data.type)
    setattr(package, 'description', package_data.description)
    setattr(package, 'price', package_data.price)
    
    db.commit()
    db.refresh(package)
    return package

@router.delete("/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(CateringPackage).filter(CateringPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paket tidak ditemukan")
    
    db.delete(package)
    db.commit()
    return {"message": "Paket berhasil dihapus"}

@router.get("/{package_id}", response_model=PackageOut)
def get_package_by_id(package_id: int, db: Session = Depends(get_db)):
    package = db.query(CateringPackage).filter(CateringPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paket tidak ditemukan")
    return package
