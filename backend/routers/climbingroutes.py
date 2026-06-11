from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClimbingRoute
from schemas import ClimbingRouteCreate, ClimbingRouteResponse

router = APIRouter(prefix="/climbingroutes", tags=["climbingroutes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ClimbingRouteResponse)
def create_climbing_route(route: ClimbingRouteCreate, db: Session = Depends(get_db)):
    db_route = ClimbingRoute(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route
