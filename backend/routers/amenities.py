from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import AmenityResponse, AmenityCreate
import models
from database import SessionLocal
from auth import get_current_user_required

router = APIRouter(prefix="/amenities", tags=["amenities"])

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    return db.query(models.Amenity).all()


@router.post("/", response_model=AmenityResponse)
def create_amenity(amenity: AmenityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):

    # evitar duplicados
    existing = db.query(models.Amenity).filter(models.Amenity.name == amenity.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenity ya existe")

    db_amenity = models.Amenity(name=amenity.name)

    db.add(db_amenity)
    db.commit()
    db.refresh(db_amenity)

    return db_amenity