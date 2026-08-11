from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClimbingRoute
from schemas import ClimbingRouteCreate, ClimbingRouteResponse
from auth import get_current_user_required
from ownership import assert_owns_sector
from limiter import limiter

router = APIRouter(prefix="/climbingroutes", tags=["climbingroutes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ClimbingRouteResponse)
@limiter.limit("10/minute")
async def create_climbing_route(request: Request, route: ClimbingRouteCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    assert_owns_sector(db, route.sector_id, user)
    db_route = ClimbingRoute(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route
