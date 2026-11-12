from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
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
    from spot_payloads import SPOT_LIST_OPTIONS, serialize_spot_list
    spots = (
        home.visible(db.query(SpotDB).options(*SPOT_LIST_OPTIONS))
        .join(Favorite, Favorite.spot_id == SpotDB.id)
        .filter(Favorite.user_id == user["sub"])
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
        .all()
    )
    return serialize_spot_list(db, spots)


MAX_BULK = 60


@router.post("/bulk")
@limiter.limit("10/minute")
async def add_favorites(request: Request, body: dict = Body(...), db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Guardar varios de una ("Guardar todos los lugares" de una nota del
    blog). Solo los publicados; los que ya estaban no cuentan como error."""
    ids = body.get("spot_ids")
    if not isinstance(ids, list) or not ids or len(ids) > MAX_BULK or not all(isinstance(i, int) and not isinstance(i, bool) for i in ids):
        raise HTTPException(status_code=422, detail=f"spot_ids: entre 1 y {MAX_BULK} ids")
    wanted = set(ids)
    visible = {s.id for s in home.visible(db.query(SpotDB.id).filter(SpotDB.id.in_(wanted)))}
    already = {f.spot_id for f in db.query(Favorite.spot_id).filter(Favorite.user_id == user["sub"], Favorite.spot_id.in_(visible))}
    added = [i for i in ids if i in visible and i not in already]
    for spot_id in dict.fromkeys(added):
        db.add(Favorite(user_id=user["sub"], spot_id=spot_id))
    try:
        db.commit()
    except IntegrityError:
        # Otro pedido igual al mismo tiempo: lo que quedó guardado, quedó.
        db.rollback()
    return {"added": len(set(added)), "saved": len(visible)}


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