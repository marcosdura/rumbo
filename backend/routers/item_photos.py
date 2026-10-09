from typing import Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import item_photos
from auth import get_current_user_required
from database import get_db
from limiter import limiter

router = APIRouter(tags=["photos"])


class PhotosCreate(BaseModel):
    target: Literal["trekking_route", "climbing_sector", "climbing_route"]
    target_id: int
    # Los public_id que devolvió Cloudinary ("rumbo/spots/{spot_id}/{16 hex}").
    public_ids: list[str] = Field(min_length=1, max_length=item_photos.MAX_PHOTOS)


@router.post("/photos")
@limiter.limit("10/minute")
def add_photos(request: Request, body: PhotosCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Fotos de una ruta de trekking, un sector o una vía (item_photos.py).
    Todas pasan por revisión, salvo las del admin."""
    created = item_photos.add_photos(db, body.target, body.target_id, body.public_ids, user)
    db.commit()
    return {
        "pending": any(not p.is_approved for p in created),
        "photos": [{"id": p.id, "cloudinary_public_id": p.cloudinary_public_id} for p in created],
    }
