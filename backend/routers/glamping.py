from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GlampingDetail, GlampingAmenity, SpotDB
from schemas import GlampingDetailCreate, GlampingDetailResponse, GlampingAmenityCreate, GlampingAmenityResponse
from typing import Optional
from auth import get_current_user_required
from ownership import get_owned_spot_or_admin, assert_owns_glamping
from limiter import limiter

router = APIRouter(prefix="/glamping", tags=["glamping"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/spots/{spot_id}/glamping", response_model=GlampingDetailResponse)
@limiter.limit("10/minute")
async def add_glamping_detail(request: Request, spot_id: int, data: GlampingDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
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
@limiter.limit("10/minute")
async def delete_glamping_detail(request: Request, glamping_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    detail = assert_owns_glamping(db, glamping_id, user)
    db.delete(detail)
    db.commit()
    return {"message": "Unidad de glamping eliminada"}


@router.post("/spots/{spot_id}/amenities", response_model=GlampingAmenityResponse)
@limiter.limit("10/minute")
async def add_glamping_amenities(request: Request, spot_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    existing = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenities ya existen para este spot")
    amenities = GlampingAmenity(spot_id=spot_id, **data.dict())
    db.add(amenities)
    db.commit()
    db.refresh(amenities)
    return amenities


@router.put("/spots/{spot_id}/amenities", response_model=GlampingAmenityResponse)
@limiter.limit("10/minute")
async def update_glamping_amenities(request: Request, spot_id: int, data: GlampingAmenityCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
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
