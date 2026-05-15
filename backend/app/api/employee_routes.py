from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.employee_model import Employees
from ..schemas.employee_schema import EmployeeCreate, EmployeeOut
from ..core.security import get_password_hash

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=list[EmployeeOut])
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employees).all()

@router.post("/", response_model=EmployeeOut)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    employee_data = employee.model_dump()
    password = employee_data.pop("password")
    employee_data["hashed_password"] = get_password_hash(password)
    
    new_employee = Employees(**employee_data)
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, employee_data: EmployeeCreate, db: Session = Depends(get_db)):
    employee = db.query(Employees).filter(Employees.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee tidak ditemukan")
    
    for key, value in employee_data.model_dump().items():
        setattr(employee, key, value)
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employees).filter(Employees.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee tidak ditemukan")
    
    db.delete(employee)
    db.commit()
    return {"message": "Employee berhasil dihapus"}
