from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SpotImage, SpotDB

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/spots/{spot_id}")
def add_image_to_spot(
    spot_id: int,
    cloudinary_public_id: str,
    is_main: bool = False,
    order: int = 0,
    db: Session = Depends(get_db)
):
    # verificar que el spot existe
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")

    image = SpotImage(
        spot_id=spot_id,
        cloudinary_public_id=cloudinary_public_id,
        is_main=is_main,
        order=order
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image