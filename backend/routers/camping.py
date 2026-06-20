from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CampingDetail
from schemas import CampingDetailCreate


router = APIRouter(prefix="/camping", tags=["camping"])

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/spots/{spot_id}/camping")
def add_camping_detail(spot_id: int, data: CampingDetailCreate, db: Session = Depends(get_db)):
    
    camping = CampingDetail(
        spot_id=spot_id,
        price=data.price,
        accepts_motorhomes=data.accepts_motorhomes,
        motorhome_capacity=data.motorhome_capacity,
        motorhome_surface_type=data.motorhome_surface_type,
        motorhome_has_water=data.motorhome_has_water,
        motorhome_has_electricity=data.motorhome_has_electricity,
        motorhome_has_dump_station=data.motorhome_has_dump_station,
        motorhome_max_stay_nights=data.motorhome_max_stay_nights,
    )

    db.add(camping)
    db.commit()
    db.refresh(camping)

    return camping

