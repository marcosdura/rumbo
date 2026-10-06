"""Aportes: cosas nuevas que se suman a un spot ya aprobado.

Antes, el dueño podía sumar por API experiencias, unidades de glamping,
rutas, sectores, surf o kayak a un spot aprobado y quedaban publicados sin
revisión (el mismo bait-and-switch que cierran los pedidos de cambio de
spot_changes.py). Ahora:

- Quién puede sumar: el dueño (y el admin). Excepción: sectores y vías de
  escalada los puede sugerir cualquier usuario logueado en un spot ajeno.
- Sobre un spot aprobado, lo que suma alguien que no es admin queda
  pendiente: se guarda en su tabla con is_approved = False (el público no lo
  ve) y con un registro en contributions. El admin lo aprueba o lo rechaza
  por separado, sin el "uno a la vez" de los pedidos de cambio.
- El admin, y el dueño mientras su spot no está aprobado, suman directo.

Un sector sugerido trae sus vías: las vías que el autor carga dentro de su
propio sector pendiente no tienen registro propio y se aprueban con él.
"""
import re
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from auth import is_admin
from models import (
    ClimbingRoute, ClimbingSector, Contribution, Experience, GlampingDetail,
    KayakDetail, Route, SpotCategory, SpotDB, SurfSchool,
)
from spot_changes import destroy_cloudinary_images

KIND_MODELS = {
    "experience": Experience,
    "glamping_unit": GlampingDetail,
    "trekking_route": Route,
    "climbing_sector": ClimbingSector,
    "climbing_route": ClimbingRoute,
    "surf_school": SurfSchool,
    "kayak": KayakDetail,
}

# Los que cualquier usuario logueado puede sugerir en un spot ajeno.
COMMUNITY_KINDS = {"climbing_sector", "climbing_route"}


def _title(kind, item) -> str:
    if kind == "experience":
        return item.title
    if kind == "glamping_unit":
        return item.accommodation_type or "Unidad de glamping"
    return item.name or "Sin nombre"


def public_id_from_url(url: str):
    """Las fotos de surf y kayak se guardan como URL completa de Cloudinary
    (https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.jpg),
    no como public_id: para destruirlas hay que sacarlo de la URL."""
    if not url:
        return None
    m = re.search(r"/upload/(?:[^/]*,[^/]*/)?(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$", url)
    return m.group(1) if m else None


def item_photos(kind, item):
    if kind not in ("surf_school", "kayak"):
        return []
    urls = [item.photo_1, item.photo_2, item.photo_3]
    return [pid for pid in (public_id_from_url(u) for u in urls) if pid]


def decide(spot: SpotDB, kind: str, user: dict) -> bool:
    """¿Cómo se guarda un aporte nuevo de `kind` sobre `spot`? Devuelve True
    si queda pendiente de revisión, False si se publica directo. Lanza 403
    si el usuario no puede sumarlo."""
    if is_admin(user):
        return False
    owner = spot.owner_email == user.get("email")
    if kind in COMMUNITY_KINDS and spot.is_approved:
        # Cualquiera sugiere en un spot aprobado; el dueño también pasa por
        # revisión (lo de cualquier otro tipo también lo haría).
        return True
    if not owner:
        raise HTTPException(status_code=403, detail="No autorizado")
    return bool(spot.is_approved)


def register(db: Session, kind: str, item, spot: SpotDB, user: dict, pending: bool):
    """Después de crear `item` (sin commit): si queda pendiente, lo oculta y
    deja el registro del aporte. Devuelve el registro o None."""
    if not pending:
        item.is_approved = True
        return None
    item.is_approved = False
    db.flush()
    contribution = Contribution(
        kind=kind, item_id=item.id, spot_id=spot.id, author_email=user.get("email"),
        status="pending", title=_title(kind, item),
    )
    db.add(contribution)
    return contribution


def pending_contribution_for(db: Session, kind: str, item_id: int):
    return (
        db.query(Contribution)
        .filter(Contribution.kind == kind, Contribution.item_id == item_id, Contribution.status == "pending")
        .first()
    )


def get_item(db: Session, contribution: Contribution):
    model = KIND_MODELS[contribution.kind]
    return db.query(model).filter(model.id == contribution.item_id).first()


def _close(contribution: Contribution, status: str, by: str, reason: str = None):
    contribution.status = status
    contribution.resolved_at = datetime.now(timezone.utc)
    contribution.resolved_by = by
    contribution.reject_reason = reason


def approve(db: Session, contribution: Contribution, by: str):
    item = get_item(db, contribution)
    if item is None:
        raise HTTPException(status_code=404, detail="El elemento de este aporte ya no existe.")
    item.is_approved = True
    if contribution.kind == "climbing_sector":
        for route in item.routes:
            route.is_approved = True
    if contribution.kind == "experience":
        # Crear una experiencia suma su categoría al spot (lo hace aparecer
        # en esas búsquedas). Pendiente, se posterga hasta acá.
        exists = db.query(SpotCategory).filter_by(spot_id=item.spot_id, category_id=item.category_id).first()
        if not exists:
            db.add(SpotCategory(spot_id=item.spot_id, category_id=item.category_id, is_primary=False))
    _close(contribution, "approved", by)


def discard(db: Session, contribution: Contribution, status: str, by: str, reason: str = None):
    """Rechazar (admin) o retirar (autor): el elemento se borra, el registro
    queda. Devuelve los public_id de Cloudinary a destruir después del
    commit."""
    item = get_item(db, contribution)
    photos = []
    if item is not None:
        photos = item_photos(contribution.kind, item)
        db.delete(item)
    _close(contribution, status, by, reason)
    return photos


def withdraw_for_deleted_item(db: Session, kind: str, item_id: int, by: str):
    """El dueño borró un elemento que todavía estaba en revisión."""
    contribution = pending_contribution_for(db, kind, item_id)
    if contribution:
        _close(contribution, "withdrawn", by)


def withdraw_all_by_author(db: Session, email: str):
    """Al borrar una cuenta: sus aportes pendientes se retiran (el autor ya
    no va a ver el resultado). Devuelve las fotos a destruir."""
    photos = []
    pending = db.query(Contribution).filter(Contribution.author_email == email, Contribution.status == "pending").all()
    for contribution in pending:
        photos += discard(db, contribution, "withdrawn", by=email)
    return photos


def serialize(db: Session, contribution: Contribution, with_item: bool = False) -> dict:
    data = {
        "id": contribution.id,
        "kind": contribution.kind,
        "item_id": contribution.item_id,
        "spot_id": contribution.spot_id,
        "status": contribution.status,
        "title": contribution.title,
        "reject_reason": contribution.reject_reason,
        "created_at": contribution.created_at.isoformat() if contribution.created_at else None,
        "resolved_at": contribution.resolved_at.isoformat() if contribution.resolved_at else None,
    }
    if with_item:
        from schemas import (
            ClimbingRouteResponse, ClimbingSectorResponse, ExperienceResponse,
            GlampingDetailResponse, KayakDetailResponse, RouteResponse, SurfSchoolResponse,
        )
        schemas_by_kind = {
            "experience": ExperienceResponse, "glamping_unit": GlampingDetailResponse,
            "trekking_route": RouteResponse, "climbing_sector": ClimbingSectorResponse,
            "climbing_route": ClimbingRouteResponse, "surf_school": SurfSchoolResponse,
            "kayak": KayakDetailResponse,
        }
        item = get_item(db, contribution)
        data["item"] = schemas_by_kind[contribution.kind].model_validate(item).model_dump(mode="json") if item else None
        if contribution.kind == "climbing_sector" and item:
            data["item"]["routes"] = [ClimbingRouteResponse.model_validate(r).model_dump(mode="json") for r in item.routes]
        if contribution.kind == "climbing_route" and item:
            data["sector_name"] = item.sector.name if item.sector else None
    return data

