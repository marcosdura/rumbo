from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Favorite, SpotDB
import home
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/favorites", tags=["favorites"])



@router.get("")
def get_favorites(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Los favoritos como los muestra SpotCard (el mismo armado que la
    búsqueda y la home), del último guardado al primero, solo los
    publicados. Antes devolvía el lugar entero: con el email y el teléfono
    de su dueño, sin el puntaje de reseñas y también los despublicados."""
    from routers.spots import SPOT_LIST_OPTIONS, serialize_spot_list  # spots importa este módulo
    spots = (
        home.visible(db.query(SpotDB).options(*SPOT_LIST_OPTIONS))
        .join(Favorite, Favorite.spot_id == SpotDB.id)
        .filter(Favorite.user_id == user["sub"])
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
        .all()
    )
    return serialize_spot_list(db, spots)


@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_favorite(request: Request, spot_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    user_id = user["sub"]
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")

    favorite = Favorite(user_id=user_id, spot_id=spot_id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya está en favoritos")

    return {"message": "Agregado a favoritos", "spot_id": spot_id}


@router.delete("/{spot_id}")
@limiter.limit("30/minute")
async def remove_favorite(request: Request, spot_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    user_id = user["sub"]
    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user_id,
            Favorite.spot_id == spot_id,
        )
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorito no encontrado")

    db.delete(favorite)
    db.commit()
    return {"message": "Eliminado de favoritos", "spot_id": spot_id}