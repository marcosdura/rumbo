from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Route
from schemas import RouteCreate, RouteResponse
from database import SessionLocal

router = APIRouter(prefix="/routes", tags=["routes"])

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RouteResponse)
def create_route(route: RouteCreate, db: Session = Depends(get_db)):
    db_route = Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.get("/", response_model=list[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    return db.query(Route).all()

@router.get("/{route_id}", response_model=RouteResponse)
def get_route(route_id: int, db: Session = Depends(get_db)):
    return db.query(Route).filter(Route.id == route_id).first()