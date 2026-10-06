from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from schemas import AmenityResponse, AmenityCreate
import models
from database import get_db
from auth import get_current_admin_user
from limiter import limiter

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("/", response_model=list[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    return db.query(models.Amenity).all()


# Catálogo global: lo que se cree acá lo ven todos los usuarios. Antes lo
# podía crear cualquier logueado; el frontend nunca lo llama.
@router.post("/", response_model=AmenityResponse)
@limiter.limit("10/minute")
async def create_amenity(request: Request, amenity: AmenityCreate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):

    # evitar duplicados
    existing = db.query(models.Amenity).filter(models.Amenity.name == amenity.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenity ya existe")

    db_amenity = models.Amenity(name=amenity.name)

    db.add(db_amenity)
    db.commit()
    db.refresh(db_amenity)

    return db_amenity