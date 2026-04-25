# routers/favorites.py
# Archivo NUEVO — guardalo en la misma carpeta que tus otros routers

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from database import SessionLocal
from models import Favorite, SpotDB
from schemas import SpotResponse

router = APIRouter(prefix="/favorites", tags=["favorites"])


# ─── Dependencia DB ───────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Schema de entrada ────────────────────────────────────────────────────────
class FavoriteRequest(BaseModel):
    user_id: str  # el sub de Google


# ─── GET /favorites/{user_id} ─────────────────────────────────────────────────
@router.get("/{user_id}", response_model=list[SpotResponse])
def get_favorites(user_id: str, db: Session = Depends(get_db)):
    spots = (
        db.query(SpotDB)
        .join(Favorite, Favorite.spot_id == SpotDB.id)
        .filter(Favorite.user_id == user_id)
        .all()
    )
    return spots


# ─── POST /favorites/{spot_id} ────────────────────────────────────────────────
@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(spot_id: int, data: FavoriteRequest, db: Session = Depends(get_db)):
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")

    favorite = Favorite(user_id=data.user_id, spot_id=spot_id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya está en favoritos")

    return {"message": "Agregado a favoritos", "spot_id": spot_id}


# ─── DELETE /favorites/{spot_id} ──────────────────────────────────────────────
@router.delete("/{spot_id}")
def remove_favorite(spot_id: int, data: FavoriteRequest, db: Session = Depends(get_db)):
    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == data.user_id,
            Favorite.spot_id == spot_id,
        )
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorito no encontrado")

    db.delete(favorite)
    db.commit()
    return {"message": "Eliminado de favoritos", "spot_id": spot_id}