import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClimbingSector
from schemas import ClimbingSectorCreate, ClimbingSectorResponse
from models import ClimbingRoute
from schemas import ClimbingRouteResponse


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

@router.post("/", response_model=ClimbingSectorResponse)
def create_sector(sector: ClimbingSectorCreate, db: Session = Depends(get_db)):
    db_sector = ClimbingSector(**sector.dict())
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
    return sector

@router.get("/{sector_id}", response_model=ClimbingSectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    return db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()

@router.get("/{sector_id}/routes", response_model=list[ClimbingRouteResponse])
def get_sector_routes(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return db.query(ClimbingRoute).filter(ClimbingRoute.sector_id == sector_id).all()
