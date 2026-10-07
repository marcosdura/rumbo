from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required, is_admin
from models import SpotDB, GlampingDetail

# Playas y lagunas: lugares públicos. Una vez aprobados son del admin (ni
# quien los sugirió los edita); lo que tiene dueño propio son las escuelas
# de surf y los servicios de kayak que trabajan ahí (operators.py).
PUBLIC_VENUE_CATEGORIES = {"Surf", "Kayak"}


def is_public_venue(spot: SpotDB) -> bool:
    return bool(spot.category and spot.category.name in PUBLIC_VENUE_CATEGORIES)


def is_admin_managed(spot: SpotDB) -> bool:
    """Aprobado, lo maneja el admin y no quien lo cargó: las playas y
    lagunas, y los lugares que sugirió un visitante (no el responsable)."""
    return is_public_venue(spot) or bool(spot.suggested_by_visitor)


def can_manage_spot(spot: SpotDB, user: dict) -> bool:
    if is_admin(user):
        return True
    if spot.owner_email != user.get("email"):
        return False
    # Mientras la playa (o el lugar sugerido por un visitante) está en
    # revisión la maneja quien la sugirió (por ejemplo, para subirle las
    # fotos al crearla); aprobada, solo el admin.
    return not (is_admin_managed(spot) and spot.is_approved)


def get_owned_spot_or_admin(
    spot_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
) -> SpotDB:
    """Dependency de FastAPI para endpoints con spot_id en el path."""
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not can_manage_spot(spot, user):
        raise HTTPException(status_code=403, detail="No autorizado")
    return spot


def assert_owns_spot(db: Session, spot_id: int, user: dict) -> SpotDB:
    """Misma verificación que get_owned_spot_or_admin, para cuando spot_id
    viene del body en vez del path (no se puede usar como Depends ahí)."""
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not can_manage_spot(spot, user):
        raise HTTPException(status_code=403, detail="No autorizado")
    return spot


def assert_owns_glamping(db: Session, glamping_id: int, user: dict) -> GlampingDetail:
    """Para endpoints que solo reciben glamping_id (sin spot_id) — resuelve
    la unidad de glamping y valida ownership del spot al que pertenece."""
    # include_pending: el dueño también borra una unidad en revisión.
    detail = db.query(GlampingDetail).execution_options(include_pending=True).filter(GlampingDetail.id == glamping_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Glamping detail no encontrado")
    assert_owns_spot(db, detail.spot_id, user)
    return detail

