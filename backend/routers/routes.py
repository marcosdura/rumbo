from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import Route
from schemas import RouteCreate, RouteResponse
from database import get_db
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter
from slugs import generate_slug

router = APIRouter(prefix="/routes", tags=["routes"])

@router.post("/", response_model=RouteResponse)
@limiter.limit("10/minute")
async def create_route(request: Request, route: RouteCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    assert_owns_spot(db, route.spot_id, user)
    db_route = Route(**route.dict())
    db_route.slug = generate_slug(route.name)
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.get("/", response_model=list[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    return db.query(Route).all()

@router.get("/by-slug/{slug}", response_model=RouteResponse)
def get_route_by_slug(slug: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.slug == slug).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.get("/{route_id}", response_model=RouteResponse)
def get_route(route_id: int, db: Session = Depends(get_db)):
    return db.query(Route).filter(Route.id == route_id).first()
