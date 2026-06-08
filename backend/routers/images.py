from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import SpotImage, SpotDB
from auth import get_current_user
from limiter import limiter

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/spots/{spot_id}")
@limiter.limit("20/minute")
async def add_image_to_spot(
    request: Request,
    spot_id: int,
    cloudinary_public_id: str,
    is_main: bool = False,
    order: int = 0,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
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