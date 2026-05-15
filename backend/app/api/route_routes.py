from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.route_model import DeliveryRoute
from ..schemas.route_schema import RouteCreate, RouteOut

router = APIRouter(prefix="/routes", tags=["Delivery Routes"])

@router.get("/", response_model=list[RouteOut])
def get_all_routes(db: Session = Depends(get_db)):
    return db.query(DeliveryRoute).all()

@router.post("/", response_model=RouteOut)
def create_route(route: RouteCreate, db: Session = Depends(get_db)):
    new_route = DeliveryRoute(**route.model_dump())
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route