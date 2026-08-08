import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClimbingSector
from schemas import ClimbingSectorCreate, ClimbingSectorResponse
from models import ClimbingRoute
from schemas import ClimbingRouteResponse
from auth import get_current_user_required
from ownership import assert_owns_spot


router = APIRouter(prefix="/sectors", tags=["sectors"])

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
def create_sector(sector: ClimbingSectorCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    assert_owns_spot(db, sector.spot_id, user)
    valid_fields = {"name", "type", "max_altitude", "restrictions", "spot_id"}
    sector_data = {k: v for k, v in sector.dict().items() if k in valid_fields}
    db_sector = ClimbingSector(**sector_data)
    db_sector.slug = generate_slug(sector.name)
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

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
