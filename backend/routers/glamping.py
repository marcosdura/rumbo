from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GlampingDetail, GlampingAmenity
from schemas import GlampingDetailCreate, GlampingDetailResponse, GlampingAmenityCreate, GlampingAmenityResponse
from typing import Optional

router = APIRouter(prefix="/glamping", tags=["glamping"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/spots/{spot_id}/glamping", response_model=GlampingDetailResponse)
def add_glamping_detail(spot_id: int, data: GlampingDetailCreate, db: Session = Depends(get_db)):
    existing = db.query(GlampingDetail).filter(GlampingDetail.spot_id == spot_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Glamping detail ya existe para este spot")
    detail = GlampingDetail(spot_id=spot_id, **data.dict())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


@router.get("/spots/{spot_id}/glamping", response_model=GlampingDetailResponse)
def get_glamping_detail(spot_id: int, db: Session = Depends(get_db)):
    detail = db.query(GlampingDetail).filter(GlampingDetail.spot_id == spot_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Glamping detail no encontrado")
    return detail


@router.post("/glamping/{glamping_id}/amenities", response_model=GlampingAmenityResponse)
def add_glamping_amenities(glamping_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db)):
    existing = db.query(GlampingAmenity).filter(GlampingAmenity.glamping_id == glamping_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenities ya existen para este glamping")
    amenities = GlampingAmenity(glamping_id=glamping_id, **data.dict())
    db.add(amenities)
    db.commit()
    db.refresh(amenities)
    return amenities


@router.put("/glamping/{glamping_id}/amenities", response_model=GlampingAmenityResponse)
def update_glamping_amenities(glamping_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db)):
    amenities = db.query(GlampingAmenity).filter(GlampingAmenity.glamping_id == glamping_id).first()
    if not amenities:
        raise HTTPException(status_code=404, detail="Amenities no encontradas")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(amenities, field, value)
    db.commit()
    db.refresh(amenities)
    return amenities


@router.get("/glamping/{glamping_id}/amenities", response_model=GlampingAmenityResponse)
def get_glamping_amenities(glamping_id: int, db: Session = Depends(get_db)):
    amenities = db.query(GlampingAmenity).filter(GlampingAmenity.glamping_id == glamping_id).first()
    if not amenities:
        raise HTTPException(status_code=404, detail="Amenities no encontradas")
    return amenities
