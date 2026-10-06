"""Edición de spots y pedidos de cambio (SpotChangeRequest).

Un spot ya aprobado no puede cambiar de contenido sin revisión: antes, el
dueño publicaba algo inocuo, esperaba la aprobación y después le cambiaba el
nombre, la descripción o las fotos (bait-and-switch). El criterio:

- SENSITIVE_FIELDS + fotos agregadas → van a un pedido que revisa el admin.
  Mientras tanto el público sigue viendo la versión aprobada.
- INSTANT_FIELDS (contacto, precio, temporada, acceso) → se aplican ya.
- ADMIN_ONLY_FIELDS (ubicación) → solo el admin; si los manda el dueño se
  ignoran.
- Borrar fotos y elegir la principal siguen siendo instantáneos (no meten
  contenido nuevo) y no pasan por acá.

El admin y los spots todavía no aprobados editan directo: un spot pendiente
igual se va a revisar entero antes de publicarse.
"""
import re
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import SpotDB, SpotImage, SpotChangeRequest

SENSITIVE_FIELDS = ["name", "description"]
INSTANT_FIELDS = ["email", "whatsapp", "instagram", "price", "season_start", "season_end", "is_public", "public_transport"]
ADMIN_ONLY_FIELDS = ["department", "lat", "lng"]

MAX_PHOTOS = 10


def destroy_cloudinary_images(public_ids):
    """Borra archivos de Cloudinary sin cortar el flujo si alguno falla: un
    huérfano en Cloudinary (queda logueado) es preferible a dejar la base a
    medio actualizar."""
    for public_id in public_ids:
        try:
            result = cloudinary.uploader.destroy(public_id)
            print(f"[Cloudinary] Destruyendo {public_id}: {result}")
        except Exception as e:
            print(f"[Cloudinary] No se pudo destruir {public_id}: {e}")


def is_own_new_photo_id(spot_id: int, public_id: str) -> bool:
    """Formato que arma lib/uploadImage.ts, tal como lo devuelve Cloudinary
    (con o sin el prefijo de carpeta). Ata cada foto a su spot: el dueño no
    puede meter en un pedido, ni mandar a destruir, un archivo de otro."""
    return bool(re.fullmatch(rf"(rumbo/spots/)?{spot_id}/[0-9a-f]{{16}}", public_id))


def get_pending_request(db: Session, spot_id: int):
    return (
        db.query(SpotChangeRequest)
        .filter(SpotChangeRequest.spot_id == spot_id, SpotChangeRequest.status == "pending")
        .first()
    )


def _normalize_text(value):
    # Comparar sin espacios de los bordes: tocar Guardar después de agregar un
    # espacio no debería mandar nada a revisión.
    return (value or "").strip()


def assert_name_available(db: Session, name: str, spot_id: int):
    taken = (
        db.query(SpotDB.id)
        .filter(func.lower(SpotDB.name) == func.lower(name), SpotDB.id != spot_id)
        .first()
    )
    if taken:
        raise HTTPException(status_code=409, detail=f'Ya existe otro lugar llamado "{name}".')


def assert_photo_limit(db: Session, spot_id: int, adding: int):
    current = db.query(SpotImage).filter(SpotImage.spot_id == spot_id).count()
    if current + adding > MAX_PHOTOS:
        sobran = current + adding - MAX_PHOTOS
        raise HTTPException(
            status_code=400,
            detail=(
                f"El límite es {MAX_PHOTOS} fotos por lugar. Tenés {current} y querés agregar {adding}: "
                f"borrá al menos {sobran} para poder subirlas."
            ),
        )


def _attach_photos(db: Session, spot: SpotDB, public_ids):
    """Crea las filas de spot_images para fotos ya subidas. Van al final del
    orden; si el spot se quedó sin principal (el dueño borró todas mientras
    el pedido esperaba), la primera nueva pasa a serlo."""
    existing = db.query(SpotImage).filter(SpotImage.spot_id == spot.id).all()
    has_main = any(img.is_main for img in existing)
    next_order = max((img.order or 0 for img in existing), default=-1) + 1
    for i, public_id in enumerate(public_ids):
        db.add(SpotImage(
            spot_id=spot.id,
            cloudinary_public_id=public_id,
            is_main=(not has_main and i == 0),
            order=next_order + i,
        ))


def _validate_new_photos(spot: SpotDB, photos):
    if len(set(photos)) != len(photos):
        raise HTTPException(status_code=422, detail="photos_added tiene public_id repetidos")
    for public_id in photos:
        if not is_own_new_photo_id(spot.id, public_id):
            raise HTTPException(status_code=400, detail="public_id con formato inválido")


def plan_spot_edit(db: Session, spot: SpotDB, data: dict, admin: bool) -> dict:
    """Decide qué pasa con cada campo, sin escribir nada. Lo usa el PATCH
    real y también el dry_run del frontend, que arma con esto el aviso
    "esto va a revisión / esto se aplica ya" — así la clasificación vive en
    un solo lugar y el frontend no tiene una copia que se pueda desincronizar.

    Devuelve {"apply": {campo: valor}, "pending": {campo: {"from", "to"}},
    "photos_added": [...]}. Valida todo antes de que se escriba nada: si algo
    falla (409, límite de fotos), no se aplica ni siquiera lo instantáneo.
    """
    photos = data.get("photos_added") or []
    _validate_new_photos(spot, photos)

    allowed = SENSITIVE_FIELDS + INSTANT_FIELDS + (ADMIN_ONLY_FIELDS if admin else [])
    goes_to_review = spot.is_approved and not admin

    apply, pending = {}, {}
    for field in allowed:
        if field not in data:
            continue
        value = data[field]
        if field in SENSITIVE_FIELDS:
            value = _normalize_text(value)
            if value == _normalize_text(getattr(spot, field)):
                continue
            if field == "name":
                if not value:
                    raise HTTPException(status_code=422, detail="El nombre no puede quedar vacío.")
                assert_name_available(db, value, spot.id)
            if goes_to_review:
                pending[field] = {"from": getattr(spot, field), "to": value}
                continue
        elif value == getattr(spot, field):
            # El dashboard manda el formulario entero: sin esto, el aviso
            # diría "se aplica ya: email, WhatsApp, ..." aunque no se tocaron.
            continue
        apply[field] = value

    if photos:
        assert_photo_limit(db, spot.id, len(photos))

    if goes_to_review and (pending or photos) and get_pending_request(db, spot.id):
        raise HTTPException(
            status_code=409,
            detail="Ya tenés un cambio en revisión para este lugar. Esperá a que se resuelva o cancelalo.",
        )

    return {"apply": apply, "pending": pending, "photos_added": photos if goes_to_review else [], "photos_direct": [] if goes_to_review else photos}


def execute_spot_edit(db: Session, spot: SpotDB, plan: dict, requested_by: str):
    """Escribe lo que plan_spot_edit decidió. Devuelve el pedido creado (o
    None si no hizo falta ninguno)."""
    for field, value in plan["apply"].items():
        setattr(spot, field, value)
    if plan["photos_direct"]:
        _attach_photos(db, spot, plan["photos_direct"])

    request = None
    if plan["pending"] or plan["photos_added"]:
        changes = dict(plan["pending"])
        if plan["photos_added"]:
            changes["photos_added"] = plan["photos_added"]
        request = SpotChangeRequest(spot_id=spot.id, requested_by=requested_by, status="pending", changes=changes)
        db.add(request)

    try:
        db.commit()
    except IntegrityError:
        # Carrera con otro request que creó el pedido pendiente entre el
        # chequeo de plan_spot_edit y este commit (el índice único parcial).
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ya tenés un cambio en revisión para este lugar. Esperá a que se resuelva o cancelalo.",
        )
    return request


def apply_request_to_spot(db: Session, request: SpotChangeRequest):
    """Vuelca el contenido del pedido sobre el spot (al aprobar, o al
    desaprobar el spot entero). No hace commit."""
    spot = request.spot
    for field in SENSITIVE_FIELDS:
        if field in request.changes:
            setattr(spot, field, request.changes[field]["to"])
    _attach_photos(db, spot, request.changes.get("photos_added", []))


def unpublish_spot(db: Session, spot: SpotDB, by: str):
    """Un spot aprobado vuelve a no publicado. Si tenía un pedido de cambio
    abierto, el pedido se vuelca sobre el spot: desde ahora sus ediciones van
    directo (un spot no publicado se revisa entero antes de volver), y el
    pedido quedaría colgado con datos viejos."""
    if spot.is_approved:
        pending = get_pending_request(db, spot.id)
        if pending:
            apply_request_to_spot(db, pending)
            close_request(pending, "approved", by=by)
            # No es una aprobación real que el dueño tenga que ver.
            pending.owner_dismissed_at = pending.resolved_at
    spot.is_approved = False


def reject_spot(db: Session, spot: SpotDB, reason: str, by: str):
    """Rechazar un spot nuevo o despublicar uno aprobado, con el motivo que
    ve el dueño (que corrige y lo reenvía). No hace commit."""
    unpublish_spot(db, spot, by)
    spot.rejection_reason = reason.strip()
    spot.rejected_at = datetime.now(timezone.utc)


def close_request(request: SpotChangeRequest, status: str, by: str, reason: str = None):
    request.status = status
    request.resolved_at = datetime.now(timezone.utc)
    request.resolved_by = by
    request.reject_reason = reason


def request_photos(request: SpotChangeRequest):
    return list((request.changes or {}).get("photos_added", []))


def serialize_request(request: SpotChangeRequest) -> dict:
    return {
        "id": request.id,
        "spot_id": request.spot_id,
        "status": request.status,
        "changes": request.changes,
        "reject_reason": request.reject_reason,
        "created_at": request.created_at.isoformat() if request.created_at else None,
        "resolved_at": request.resolved_at.isoformat() if request.resolved_at else None,
    }


def owner_visible_request(db: Session, spot_id: int):
    """Lo que el dueño tiene que ver en su dashboard: el pedido pendiente, o
    si no hay, el último resuelto por el admin que todavía no cerró. Los
    cancelados por él mismo no se muestran."""
    pending = get_pending_request(db, spot_id)
    if pending:
        return pending
    # Solo el más reciente: si ese ya se cerró, un aviso más viejo que quedó
    # sin cerrar no tiene que reaparecer.
    latest = (
        db.query(SpotChangeRequest)
        .filter(
            SpotChangeRequest.spot_id == spot_id,
            SpotChangeRequest.status.in_(["approved", "rejected"]),
        )
        .order_by(SpotChangeRequest.resolved_at.desc())
        .first()
    )
    return latest if latest and latest.owner_dismissed_at is None else None
