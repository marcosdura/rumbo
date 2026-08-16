from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from schemas import AmenityResponse, AmenityCreate
import models
from database import get_db
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("/", response_model=list[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    return db.query(models.Amenity).all()


@router.post("/", response_model=AmenityResponse)
@limiter.limit("10/minute")
async def create_amenity(request: Request, amenity: AmenityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):

    # evitar duplicados
    existing = db.query(models.Amenity).filter(models.Amenity.name == amenity.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenity ya existe")

    db_amenity = models.Amenity(name=amenity.name)

    db.add(db_amenity)
    db.commit()
    db.refresh(db_amenity)

    return db_amenity