"""Subidas a Cloudinary: el tope por usuario y la limpieza de huérfanos.

Las fotos suben directo del navegador a Cloudinary con una firma que da
GET /spots/{id}/can-upload, y recién después se registran en Rumbo (spot,
pedido de cambio, ruta, sector, vía). En un lugar con rutas o sectores
cualquier usuario logueado puede pedir firmas, y el archivo queda público en
Cloudinary apenas sube, se registre o no. Por eso cada firma deja un permiso
(UploadTicket):
- tope por usuario (no por IP): HOUR_LIMIT por hora y DAY_LIMIT por día;
  el admin no tiene tope;
- lo que a las ORPHAN_AFTER no quedó registrado en ningún lado se borra de
  Cloudinary (cleanup_orphans, que corre solo cada CLEANUP_EVERY: main.py).
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from auth import is_admin
from database import SessionLocal
from item_photos import is_public_id_used
from models import SpotChangeRequest, UploadTicket
from spot_changes import destroy_cloudinary_images, request_photos

HOUR_LIMIT = 40
DAY_LIMIT = 150
ORPHAN_AFTER = timedelta(hours=24)
CLEANUP_EVERY = timedelta(hours=6)
CLEANUP_BATCH = 200
# La primera pasada, un rato después de arrancar (no en el arranque mismo).
FIRST_CLEANUP_AFTER = timedelta(minutes=5)

log = logging.getLogger("uploads")


def full_id(public_id: str) -> str:
    """Como lo guarda Cloudinary: con la carpeta adelante."""
    return public_id if public_id.startswith("rumbo/spots/") else f"rumbo/spots/{public_id}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def issue_ticket(db: Session, spot_id: int, public_id: str, user: dict, now: datetime | None = None) -> None:
    """Anota el permiso, o corta con 429 si el usuario llegó a su tope."""
    now = now or _now()
    email = user.get("email") or ""
    # Un reintento de la misma subida: el permiso ya está (y es suyo).
    existing = db.query(UploadTicket).filter(UploadTicket.public_id == full_id(public_id)).first()
    if existing:
        if existing.user_email != email:
            raise HTTPException(status_code=409, detail="Ese public_id ya está en uso")
        return
    if not is_admin(user):
        mine = db.query(UploadTicket).filter(UploadTicket.user_email == email)
        if mine.filter(UploadTicket.created_at >= now - timedelta(hours=1)).count() >= HOUR_LIMIT:
            raise HTTPException(status_code=429, detail="Subiste muchas fotos en la última hora. Probá de nuevo más tarde.")
        if mine.filter(UploadTicket.created_at >= now - timedelta(days=1)).count() >= DAY_LIMIT:
            raise HTTPException(status_code=429, detail="Llegaste al máximo de fotos por hoy. Probá de nuevo mañana.")
    db.add(UploadTicket(public_id=full_id(public_id), spot_id=spot_id, user_email=email, created_at=now))
    db.commit()


def _in_pending_requests(db: Session) -> set[str]:
    """Las fotos nuevas de los pedidos de cambio pendientes (todavía sin fila
    propia: viven en el JSON del pedido)."""
    ids: set[str] = set()
    for request in db.query(SpotChangeRequest).filter(SpotChangeRequest.status == "pending"):
        ids.update(full_id(p) for p in request_photos(request))
    return ids


def cleanup_orphans(db: Session, now: datetime | None = None) -> dict:
    """Borra de Cloudinary lo que se subió hace más de ORPHAN_AFTER y no quedó
    registrado; el permiso de lo registrado se descarta (ya no hace falta).
    Los permisos de la última ORPHAN_AFTER quedan: cuentan para el tope y
    puede que la foto se esté por registrar."""
    now = now or _now()
    old = (
        db.query(UploadTicket)
        .filter(UploadTicket.created_at < now - ORPHAN_AFTER)
        .order_by(UploadTicket.id)
        .limit(CLEANUP_BATCH)
        .all()
    )
    if not old:
        return {"destroyed": 0, "kept": 0}
    pending = _in_pending_requests(db)
    orphans = [t.public_id for t in old if t.public_id not in pending and not is_public_id_used(db, t.public_id)]
    destroy_cloudinary_images(orphans)
    for ticket in old:
        db.delete(ticket)
    db.commit()
    return {"destroyed": len(orphans), "kept": len(old) - len(orphans)}


def run_cleanup() -> dict | None:
    """Una pasada con su propia sesión. Un error se loguea y no corta nada:
    la próxima pasada lo vuelve a intentar."""
    db = SessionLocal()
    try:
        result = cleanup_orphans(db)
        if result["destroyed"]:
            log.info("Subidas sin registrar borradas de Cloudinary: %s", result)
        return result
    except Exception:
        log.exception("No se pudo limpiar las subidas sin registrar")
        db.rollback()
        return None
    finally:
        db.close()


async def cleanup_forever() -> None:
    """La limpieza periódica (la arranca main.py al levantar el servidor)."""
    await asyncio.sleep(FIRST_CLEANUP_AFTER.total_seconds())
    while True:
        await asyncio.to_thread(run_cleanup)
        await asyncio.sleep(CLEANUP_EVERY.total_seconds())
