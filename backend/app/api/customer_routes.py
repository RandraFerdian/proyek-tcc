from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.customer import Customer
from ..schemas.customer import CustomerCreate, CustomerOut
from ..core.security import get_password_hash

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=list[CustomerOut])
def get_all_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.post("/", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if customer.email:
        existing = db.query(Customer).filter(Customer.email == customer.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email sudah terdaftar")
            
    user_data = customer.model_dump()
    password = user_data.pop("password")
    user_data["hashed_password"] = get_password_hash(password)
    
    new_customer = Customer(**user_data)
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan")
    
    for key, value in customer_data.model_dump().items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan")
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer berhasil dihapus"}
