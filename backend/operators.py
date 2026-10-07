"""Escuelas de surf y servicios de kayak ("operadores").

Cada uno es casi un lugar propio (nombre, contacto, fotos, reseñas, página
pública) que trabaja dentro de una playa o laguna. La playa es un lugar
público que, aprobado, maneja el admin (ownership.is_public_venue); la
escuela tiene su propio dueño: quien la sumó.

- Sumar una escuela a una playa: cualquier usuario logueado, siempre con
  revisión (salvo el admin). Pasa a ser su dueño.
- Manejarla (editar, borrar): su dueño o el admin. En un lugar que no es
  playa/laguna (datos viejos), también el dueño del lugar.
- Fotos: se guardan como URL completa, así que se validan acá: solo de
  nuestro Cloudinary y con el formato de esa playa ("{spot_id}/{16 hex}",
  el que firma can-upload). Antes se aceptaba cualquier URL.
"""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import is_admin
from contributions import is_own_new_photo_id_url, public_id_from_url
from models import KayakDetail, OperatorChangeRequest, SurfSchool
from ownership import is_public_venue
from spot_changes import destroy_cloudinary_images
from notifications import notify_admin

PHOTO_FIELDS = ["photo_1", "photo_2", "photo_3"]


def assert_valid_photos(spot_id: int, urls, keep=()):
    """`keep`: URLs que el operador ya tenía (al editar, no se revalidan)."""
    for url in urls:
        if not url or url in keep:
            continue
        if not is_own_new_photo_id_url(spot_id, url):
            raise HTTPException(status_code=400, detail="Foto con formato inválido")


def can_manage_operator(operator, spot, user: dict) -> bool:
    if is_admin(user):
        return True
    email = user.get("email")
    if operator.owner_email and operator.owner_email == email:
        return True
    return not is_public_venue(spot) and spot.owner_email == email


def assert_can_manage_operator(operator, spot, user: dict):
    if not can_manage_operator(operator, spot, user):
        raise HTTPException(status_code=403, detail="No autorizado")


# -------- Pedidos de cambio (mismo criterio que spot_changes.py) --------

OPERATOR_MODELS = {"surf_school": SurfSchool, "kayak": KayakDetail}

# Se aplican al instante (como contacto y precio en un spot). Nombre y fotos
# pasan por revisión.
INSTANT_FIELDS = {
    "surf_school": ["class_type", "duration", "equipment_include", "levels", "languages", "email", "whatsapp", "instagram", "season_start", "season_end"],
    "kayak": ["water_type", "difficulty", "duration", "kayak_type", "rental_available", "includes_guide", "includes_life_jacket", "email", "whatsapp", "instagram", "season_start", "season_end"],
}


def get_operator(db: Session, kind: str, operator_id: int):
    model = OPERATOR_MODELS.get(kind)
    if not model:
        raise HTTPException(status_code=404, detail="Tipo desconocido")
    # include_pending: su dueño también maneja una escuela todavía en revisión.
    operator = db.query(model).execution_options(include_pending=True).filter(model.id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="No encontrado")
    return operator


def current_photos(operator):
    return [getattr(operator, f) for f in PHOTO_FIELDS if getattr(operator, f)]


def set_photos(operator, photos):
    for i, field in enumerate(PHOTO_FIELDS):
        setattr(operator, field, photos[i] if i < len(photos) else None)


def get_pending_change(db: Session, kind: str, operator_id: int):
    return (
        db.query(OperatorChangeRequest)
        .filter_by(kind=kind, operator_id=operator_id, status="pending")
        .first()
    )


def plan_operator_edit(db: Session, kind: str, operator, data: dict, admin: bool) -> dict:
    """Qué se aplica ya y qué va a revisión, sin escribir nada (también para
    el dry_run del dashboard). Valida todo antes."""
    # Revisión solo para un operador ya publicado y si no edita el admin: uno
    # en revisión se revisa entero al aprobar el aporte.
    goes_to_review = operator.is_approved and not admin
    apply, pending = {}, {}

    if "name" in data and data["name"] is not None:
        name = data["name"].strip()
        if not name:
            raise HTTPException(status_code=422, detail="El nombre no puede quedar vacío.")
        if name != (operator.name or "").strip():
            if goes_to_review:
                pending["name"] = {"from": operator.name, "to": name}
            else:
                apply["name"] = name

    if data.get("photos") is not None:
        photos = [p for p in data["photos"] if p]
        before = current_photos(operator)
        if photos != before:
            assert_valid_photos(operator.spot_id, photos, keep=before)
            if goes_to_review and set(photos) - set(before):
                # Fotos nuevas: a revisión. Solo sacar o reordenar las que ya
                # estaban no mete contenido nuevo: se aplica ya.
                pending["photos"] = {"from": before, "to": photos}
            else:
                apply["photos"] = photos

    for field in INSTANT_FIELDS[kind]:
        if field in data and data[field] != getattr(operator, field):
            apply[field] = data[field]

    if pending and get_pending_change(db, kind, operator.id):
        raise HTTPException(
            status_code=409,
            detail="Ya tenés un cambio en revisión. Esperá a que se resuelva o cancelalo.",
        )
    return {"apply": apply, "pending": pending}


def execute_operator_edit(db: Session, kind: str, operator, plan: dict, requested_by: str):
    removed = []
    for field, value in plan["apply"].items():
        if field == "photos":
            removed = [p for p in current_photos(operator) if p not in value]
            set_photos(operator, value)
        else:
            setattr(operator, field, value)
    request = None
    if plan["pending"]:
        request = OperatorChangeRequest(
            kind=kind, operator_id=operator.id, spot_id=operator.spot_id,
            requested_by=requested_by, status="pending", changes=plan["pending"],
        )
        db.add(request)
        notify_admin(db, "admin_operator_change", f"Pedido de cambio en «{operator.name}»", body=requested_by)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya tenés un cambio en revisión. Esperá a que se resuelva o cancelalo.")
    # Fotos que se sacaron: ya no las usa nadie.
    destroy_cloudinary_images([public_id_from_url(p) for p in removed if public_id_from_url(p)])
    return request


def _close(request, status: str, by: str, reason: str = None):
    request.status = status
    request.resolved_at = datetime.now(timezone.utc)
    request.resolved_by = by
    request.reject_reason = reason


def _new_photos(request):
    photos = (request.changes or {}).get("photos")
    if not photos:
        return []
    return [p for p in photos["to"] if p not in photos["from"]]


def approve_change(db: Session, request, by: str):
    operator = get_operator(db, request.kind, request.operator_id)
    removed = []
    if "name" in request.changes:
        operator.name = request.changes["name"]["to"]
    if "photos" in request.changes:
        # Las de "from" que ya no están en "to" se reemplazaron: se destruyen.
        removed = [p for p in current_photos(operator) if p not in request.changes["photos"]["to"]]
        set_photos(operator, request.changes["photos"]["to"])
    _close(request, "approved", by)
    return [public_id_from_url(p) for p in removed if public_id_from_url(p)]


def discard_change(request, status: str, by: str, reason: str = None):
    """Rechazar (admin) o cancelar (dueño): las fotos nuevas del pedido nunca
    se publicaron. Devuelve sus public_id para destruir después del commit."""
    _close(request, status, by, reason)
    return [public_id_from_url(p) for p in _new_photos(request) if public_id_from_url(p)]


def cancel_pending_change(db: Session, kind: str, operator_id: int, by: str):
    """Al borrar un operador: su pedido pendiente se cancela."""
    request = get_pending_change(db, kind, operator_id)
    return discard_change(request, "cancelled", by) if request else []


def serialize_change(request) -> dict:
    return {
        "id": request.id,
        "kind": request.kind,
        "operator_id": request.operator_id,
        "status": request.status,
        "changes": request.changes,
        "reject_reason": request.reject_reason,
        "created_at": request.created_at.isoformat() if request.created_at else None,
        "resolved_at": request.resolved_at.isoformat() if request.resolved_at else None,
    }


def owner_visible_change(db: Session, kind: str, operator_id: int):
    """El pendiente, o el último resuelto que el dueño todavía no cerró."""
    pending = get_pending_change(db, kind, operator_id)
    if pending:
        return pending
    latest = (
        db.query(OperatorChangeRequest)
        .filter(
            OperatorChangeRequest.kind == kind,
            OperatorChangeRequest.operator_id == operator_id,
            OperatorChangeRequest.status.in_(["approved", "rejected"]),
        )
        .order_by(OperatorChangeRequest.resolved_at.desc())
        .first()
    )
    return latest if latest and latest.owner_dismissed_at is None else None
