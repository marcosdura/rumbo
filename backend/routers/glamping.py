from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GlampingDetail, GlampingAmenity
from schemas import GlampingDetailCreate, GlampingDetailResponse, GlampingAmenityCreate, GlampingAmenityResponse
from typing import Optional
from auth import get_current_user_required

router = APIRouter(prefix="/glamping", tags=["glamping"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/spots/{spot_id}/glamping", response_model=GlampingDetailResponse)
def add_glamping_detail(spot_id: int, data: GlampingDetailCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    detail = GlampingDetail(spot_id=spot_id, **data.dict())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


@router.get("/spots/{spot_id}/glamping", response_model=list[GlampingDetailResponse])
def get_glamping_detail(spot_id: int, db: Session = Depends(get_db)):
    details = db.query(GlampingDetail).filter(GlampingDetail.spot_id == spot_id).all()
    return details


@router.delete("/glamping/{glamping_id}")
def delete_glamping_detail(glamping_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    detail = db.query(GlampingDetail).filter(GlampingDetail.id == glamping_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Glamping detail no encontrado")
    db.delete(detail)
    db.commit()
    return {"message": "Unidad de glamping eliminada"}


@router.post("/spots/{spot_id}/amenities", response_model=GlampingAmenityResponse)
def add_glamping_amenities(spot_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    existing = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenities ya existen para este spot")
    amenities = GlampingAmenity(spot_id=spot_id, **data.dict())
    db.add(amenities)
    db.commit()
    db.refresh(amenities)
    return amenities


@router.put("/spots/{spot_id}/amenities", response_model=GlampingAmenityResponse)
def update_glamping_amenities(spot_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    amenities = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
    if not amenities:
        raise HTTPException(status_code=404, detail="Amenities no encontradas")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(amenities, field, value)
    db.commit()
    db.refresh(amenities)
    return amenities


@router.get("/spots/{spot_id}/amenities", response_model=GlampingAmenityResponse)
def get_glamping_amenities(spot_id: int, db: Session = Depends(get_db)):
    amenities = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
    if not amenities:
        raise HTTPException(status_code=404, detail="Amenities no encontradas")
    return amenities
