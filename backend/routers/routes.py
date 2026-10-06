from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import Route
from schemas import RouteCreate, RouteResponse
from database import get_db
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter
from slugs import generate_slug
import contributions

router = APIRouter(prefix="/routes", tags=["routes"])

@router.post("/", response_model=RouteResponse)
@limiter.limit("10/minute")
async def create_route(request: Request, route: RouteCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    spot = assert_owns_spot(db, route.spot_id, user)
    pending = contributions.decide(spot, "trekking_route", user)
    db_route = Route(**route.dict())
    db_route.slug = generate_slug(route.name)
    db.add(db_route)
    db.flush()
    contributions.register(db, "trekking_route", db_route, spot, user, pending)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/{route_id}")
@limiter.limit("20/minute")
def delete_route(request: Request, route_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    # include_pending: el dueño también borra una ruta en revisión.
    route = db.query(Route).execution_options(include_pending=True).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    assert_owns_spot(db, route.spot_id, user)
    contributions.delete_item(db, "trekking_route", route, by=user.get("email"))
    db.commit()
    return {"ok": True}


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
    route = db.query(Route).filter(Route.id == route_id).first()
    # Antes devolvía None, que con response_model terminaba en un 500.
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
