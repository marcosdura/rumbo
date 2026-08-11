import re
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import Route
from schemas import RouteCreate, RouteResponse
from database import SessionLocal
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter

router = APIRouter(prefix="/routes", tags=["routes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[áàäâ]', 'a', slug)
    slug = re.sub(r'[éèëê]', 'e', slug)
    slug = re.sub(r'[íìïî]', 'i', slug)
    slug = re.sub(r'[óòöô]', 'o', slug)
    slug = re.sub(r'[úùüû]', 'u', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

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
