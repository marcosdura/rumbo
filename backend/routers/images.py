from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import SpotImage, SpotDB
from auth import get_current_user
from limiter import limiter
from typing import Optional

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/spots/{spot_id}")
@limiter.limit("20/minute")
async def add_image_to_spot(
    request: Request,
    spot_id: int,
    cloudinary_public_id: str,
    is_main: bool = False,
    order: int = 0,
    focal_x: float = 0.5,
    focal_y: float = 0.5,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user),
):
    # verificar que el spot existe
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")

    image = SpotImage(
        spot_id=spot_id,
        cloudinary_public_id=cloudinary_public_id,
        is_main=is_main,
        order=order,
        focal_x=focal_x,
        focal_y=focal_y,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.patch("/{image_id}/focal")
def update_focal(image_id: int, data: dict, db: Session = Depends(get_db)):
    img = db.query(SpotImage).filter(SpotImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    if "focal_x" in data:
        img.focal_x = data["focal_x"]
    if "focal_y" in data:
        img.focal_y = data["focal_y"]
    db.commit()
    return {"ok": True, "focal_x": img.focal_x, "focal_y": img.focal_y}