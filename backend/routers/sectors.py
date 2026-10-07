from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
from models import ClimbingSector
from schemas import ClimbingSectorCreate, ClimbingSectorResponse
from models import ClimbingRoute
from schemas import ClimbingRouteResponse
from auth import get_current_user_required
from models import SpotDB
from ownership import assert_owns_spot
import contributions
from limiter import limiter
from slugs import generate_slug


router = APIRouter(prefix="/sectors", tags=["sectors"])

def _grade_sort_key(grade):
    if not grade:
        return (0, 0, 0)
    g = grade.strip().lower()
    plus = 1 if g.endswith('+') else 0
    g = g.rstrip('+')
    letter = g[-1] if g and g[-1] in 'abc' else ''
    num_part = g[:-1] if letter else g
    try:
        num = float(num_part)
    except ValueError:
        num = 0
    letter_val = {'a': 0, 'b': 1, 'c': 2}.get(letter, 0)
    return (num, letter_val, plus)


def _attach_sector_stats(sector):
    grades = [r.grade for r in sector.routes if r.grade]
    sector.routes_count = len(sector.routes)
    sector.min_grade = min(grades, key=_grade_sort_key) if grades else None
    sector.max_grade = max(grades, key=_grade_sort_key) if grades else None
    return sector

@router.post("/", response_model=ClimbingSectorResponse)
@limiter.limit("10/minute")
async def create_sector(request: Request, sector: ClimbingSectorCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    # Escalada es la excepción: cualquier usuario logueado puede sugerir un
    # sector en un spot ajeno (queda en revisión). contributions.decide
    # decide si va directo, pendiente, o si no puede (spot ajeno sin aprobar).
    spot = db.query(SpotDB).filter(SpotDB.id == sector.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    pending = contributions.decide(spot, "climbing_sector", user)
    valid_fields = {"name", "type", "max_altitude", "restrictions", "spot_id", "approach_minutes", "sun_exposure", "rock_type"}
    sector_data = {k: v for k, v in sector.dict().items() if k in valid_fields}
    db_sector = ClimbingSector(**sector_data)
    db_sector.slug = generate_slug(sector.name)
    db.add(db_sector)
    db.flush()
    contributions.register(db, "climbing_sector", db_sector, spot, user, pending)
    db.commit()
    db.refresh(db_sector)
    return db_sector

@router.delete("/{sector_id}")
@limiter.limit("20/minute")
def delete_sector(request: Request, sector_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """El dueño del lugar (o el admin) borra un sector con todas sus vías,
    también uno que sugirió otra persona. Quien lo sugirió y todavía está
    en revisión lo retira desde /profile (POST /contributions/{id}/withdraw)."""
    sector = db.query(ClimbingSector).execution_options(include_pending=True).filter(ClimbingSector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    assert_owns_spot(db, sector.spot_id, user)
    contributions.delete_item(db, "climbing_sector", sector, by=user.get("email"))
    db.commit()
    return {"ok": True}


@router.get("/", response_model=list[ClimbingSectorResponse])
def get_sectors(spot_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = db.query(ClimbingSector)
    if spot_id is not None:
        q = q.filter(ClimbingSector.spot_id == spot_id)
    return q.all()

@router.get("/by-slug/{slug}", response_model=ClimbingSectorResponse)
def get_sector_by_slug(slug: str, db: Session = Depends(get_db)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.slug == slug).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return _attach_sector_stats(sector)

@router.get("/{sector_id}", response_model=ClimbingSectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return _attach_sector_stats(sector)

@router.get("/{sector_id}/routes", response_model=list[ClimbingRouteResponse])
def get_sector_routes(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return db.query(ClimbingRoute).filter(ClimbingRoute.sector_id == sector_id).all()
