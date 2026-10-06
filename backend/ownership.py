from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required, is_admin
from models import SpotDB, GlampingDetail


def get_owned_spot_or_admin(
    spot_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
) -> SpotDB:
    """Dependency de FastAPI para endpoints con spot_id en el path."""
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not is_admin(user) and spot.owner_email != user.get("email"):
        raise HTTPException(status_code=403, detail="No autorizado")
    return spot


def assert_owns_spot(db: Session, spot_id: int, user: dict) -> SpotDB:
    """Misma verificación que get_owned_spot_or_admin, para cuando spot_id
    viene del body en vez del path (no se puede usar como Depends ahí)."""
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not is_admin(user) and spot.owner_email != user.get("email"):
        raise HTTPException(status_code=403, detail="No autorizado")
    return spot


def assert_owns_glamping(db: Session, glamping_id: int, user: dict) -> GlampingDetail:
    """Para endpoints que solo reciben glamping_id (sin spot_id) — resuelve
    la unidad de glamping y valida ownership del spot al que pertenece."""
    detail = db.query(GlampingDetail).filter(GlampingDetail.id == glamping_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Glamping detail no encontrado")
    assert_owns_spot(db, detail.spot_id, user)
    return detail

