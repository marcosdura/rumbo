"""Fotos de rutas de trekking, sectores y vías de escalada (models.ItemPhoto).

- Las sube cualquier usuario logueado, a una ruta, sector o vía publicada de
  un lugar publicado. Todas pasan por revisión del admin (salvo las del
  admin): cada foto es un aporte (contributions.py), con su aviso al autor.
- Agregar lugar sube las fotos apenas crea la ruta, sector o vía, que puede
  estar todavía en revisión: a esa la puede sumar fotos quien la propuso, y
  el dueño a las de su lugar todavía sin aprobar.
- Hasta 3 por ruta, sector o vía, contando las que están en revisión.
- Se suben a Cloudinary con el formato de la carpeta del lugar
  ("{spot_id}/{16 hex}", el que firma can-upload) y se guarda el public_id,
  como las fotos de los lugares.
"""
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from auth import is_admin
import contributions
from models import ClimbingRoute, ClimbingSector, Contribution, ItemPhoto, Route, SpotImage
from ownership import can_manage_spot

MAX_PHOTOS = 3

# target -> (modelo, columna de item_photos)
TARGETS = {
    "trekking_route": (Route, "trekking_route_id"),
    "climbing_sector": (ClimbingSector, "climbing_sector_id"),
    "climbing_route": (ClimbingRoute, "climbing_route_id"),
}


def target_spot(target: str, item):
    return item.sector.spot if target == "climbing_route" else item.spot


def _is_public(target: str, item, spot) -> bool:
    if not spot.is_approved or spot.owner_deleted_at is not None or not item.is_approved:
        return False
    return target != "climbing_route" or item.sector.is_approved


def _proposed_by(db: Session, target: str, item, email: str) -> bool:
    """¿La propuso `email` y está en revisión? Una vía de un sector sugerido
    no tiene aporte propio: va con el del sector."""
    kind, item_id = target, item.id
    if target == "climbing_route" and not item.sector.is_approved:
        kind, item_id = "climbing_sector", item.sector_id
    return db.query(Contribution).filter_by(kind=kind, item_id=item_id, status="pending", author_email=email).first() is not None


def get_target(db: Session, target: str, target_id: int, user: dict):
    """La ruta, sector o vía a la que se suben fotos (404 si no se puede):
    publicada, o en revisión si la propuso este usuario, o de su lugar
    todavía sin aprobar."""
    if target not in TARGETS:
        raise HTTPException(status_code=422, detail="Tipo desconocido")
    model, _ = TARGETS[target]
    item = db.query(model).execution_options(include_pending=True).filter(model.id == target_id).first()
    spot = target_spot(target, item) if item else None
    if not item or not spot or spot.owner_deleted_at is not None:
        raise HTTPException(status_code=404, detail="No encontrado")
    if _is_public(target, item, spot) or is_admin(user):
        return item, spot
    if not spot.is_approved and can_manage_spot(spot, user):
        return item, spot
    if spot.is_approved and _proposed_by(db, target, item, user.get("email")):
        return item, spot
    raise HTTPException(status_code=404, detail="No encontrado")


def count_photos(db: Session, target: str, target_id: int) -> int:
    """Publicadas y en revisión: el tope de 3 cuenta las dos."""
    _, column = TARGETS[target]
    return (
        db.query(ItemPhoto).execution_options(include_pending=True)
        .filter(getattr(ItemPhoto, column) == target_id)
        .count()
    )


def free_slots(db: Session, target: str, target_id: int) -> int:
    return max(0, MAX_PHOTOS - count_photos(db, target, target_id))


def normalize_public_id(spot_id: int, public_id: str):
    """Cloudinary guarda la foto en la carpeta "rumbo/spots": se acepta con o
    sin ese prefijo, siempre del lugar de la ruta."""
    if re.fullmatch(rf"(rumbo/spots/)?{spot_id}/[0-9a-f]{{16}}", public_id or ""):
        return public_id if public_id.startswith("rumbo/spots/") else f"rumbo/spots/{public_id}"
    return None


def is_public_id_used(db: Session, public_id: str) -> bool:
    short = public_id.removeprefix("rumbo/spots/")
    variants = [public_id, short]
    return bool(
        db.query(ItemPhoto).execution_options(include_pending=True).filter(ItemPhoto.cloudinary_public_id.in_(variants)).first()
        or db.query(SpotImage).filter(SpotImage.cloudinary_public_id.in_(variants)).first()
    )


def add_photos(db: Session, target: str, target_id: int, public_ids: list[str], user: dict):
    """Crea las fotos (en revisión salvo el admin). Devuelve las creadas."""
    item, spot = get_target(db, target, target_id, user)
    if not public_ids:
        raise HTTPException(status_code=422, detail="Elegí al menos una foto.")
    if len(public_ids) > free_slots(db, target, target_id):
        raise HTTPException(status_code=409, detail=f"Ya tiene el máximo de {MAX_PHOTOS} fotos (contando las que están en revisión).")
    normalized = []
    for raw in public_ids:
        public_id = normalize_public_id(spot.id, raw)
        if not public_id:
            raise HTTPException(status_code=400, detail="Foto con formato inválido")
        if public_id in normalized or is_public_id_used(db, public_id):
            raise HTTPException(status_code=409, detail="Esa foto ya está cargada")
        normalized.append(public_id)

    pending = not is_admin(user)
    _, column = TARGETS[target]
    created = []
    for public_id in normalized:
        photo = ItemPhoto(spot_id=spot.id, cloudinary_public_id=public_id, uploaded_by=user.get("email"), **{column: item.id})
        db.add(photo)
        db.flush()
        contributions.register(db, "photo", photo, spot, user, pending)
        created.append(photo)
    return created


def photos_of(db: Session, target: str, target_ids: list[int]) -> dict[int, list[dict]]:
    """Las fotos publicadas de cada ruta, sector o vía, en orden de subida."""
    if not target_ids:
        return {}
    _, column = TARGETS[target]
    col = getattr(ItemPhoto, column)
    rows = db.query(ItemPhoto).filter(col.in_(target_ids)).order_by(ItemPhoto.id).all()
    result: dict[int, list[dict]] = {i: [] for i in target_ids}
    for p in rows:
        result[getattr(p, column)].append({"id": p.id, "cloudinary_public_id": p.cloudinary_public_id})
    return result


def slots_of(db: Session, target: str, target_ids: list[int]) -> dict[int, int]:
    """Cuántas fotos más se pueden subir a cada una (para el botón)."""
    if not target_ids:
        return {}
    _, column = TARGETS[target]
    col = getattr(ItemPhoto, column)
    counts = {i: 0 for i in target_ids}
    for (tid,) in db.query(col).execution_options(include_pending=True).filter(col.in_(target_ids)).all():
        counts[tid] += 1
    return {i: max(0, MAX_PHOTOS - n) for i, n in counts.items()}


def photos_for_deleted(db: Session, column: str, ids: list[int], by: str) -> list[str]:
    """Al borrar rutas, sectores o vías: se borran sus fotos (también las en
    revisión; a mano, sin depender del ON DELETE CASCADE), se cierran sus
    aportes y se devuelven los archivos para destruir después del commit."""
    if not ids:
        return []
    rows = db.query(ItemPhoto).execution_options(include_pending=True).filter(getattr(ItemPhoto, column).in_(ids)).all()
    for photo in rows:
        contributions.withdraw_for_deleted_item(db, "photo", photo.id, by)
        db.delete(photo)
    return [p.cloudinary_public_id for p in rows]
