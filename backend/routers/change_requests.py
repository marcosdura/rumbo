from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from auth import get_current_admin_user
from database import get_db
from limiter import limiter
from models import SpotChangeRequest, SpotDB, SpotImage
from ownership import get_owned_spot_or_admin
from schemas import ChangeRequestReject, DiscardPhotosRequest
from spot_changes import (
    apply_request_to_spot, assert_name_available, assert_photo_limit, close_request,
    destroy_cloudinary_images, get_pending_request, is_own_new_photo_id,
    request_photos, serialize_request,
)

router = APIRouter(tags=["change-requests"])


# -------- Dueño --------

@router.post("/spots/{spot_id}/change-request/cancel")
@limiter.limit("20/minute")
def cancel_change_request(request: Request, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    pending = get_pending_request(db, spot.id)
    if not pending:
        raise HTTPException(status_code=404, detail="No hay ningún cambio en revisión para este lugar.")
    photos = request_photos(pending)
    close_request(pending, "cancelled", by=pending.requested_by)
    db.commit()
    # Las fotos del pedido nunca llegaron a spot_images: si no se destruyen
    # acá, quedan en Cloudinary para siempre ocupando cuota.
    destroy_cloudinary_images(photos)
    return {"ok": True}


@router.post("/spots/{spot_id}/change-request/dismiss")
def dismiss_change_request(spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """El dueño cierra el aviso de "tu cambio fue aprobado/rechazado"."""
    now = datetime.now(timezone.utc)
    (
        db.query(SpotChangeRequest)
        .filter(
            SpotChangeRequest.spot_id == spot.id,
            SpotChangeRequest.status.in_(["approved", "rejected"]),
            SpotChangeRequest.owner_dismissed_at.is_(None),
        )
        .update({"owner_dismissed_at": now}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True}


@router.post("/spots/{spot_id}/change-request/discard-photos")
@limiter.limit("20/minute")
def discard_uploaded_photos(request: Request, body: DiscardPhotosRequest, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Limpieza para cuando el frontend ya subió fotos a Cloudinary pero el
    guardado falló después (409, límite, red): sin esto quedan huérfanas.
    Solo destruye ids con el formato de ESTE spot que no estén en uso — ni
    publicados en spot_images ni dentro de un pedido pendiente."""
    candidates = [p for p in body.public_ids if is_own_new_photo_id(spot.id, p)]
    if not candidates:
        return {"discarded": []}
    in_use = {
        row.cloudinary_public_id
        for row in db.query(SpotImage.cloudinary_public_id).filter(SpotImage.cloudinary_public_id.in_(candidates))
    }
    pending = get_pending_request(db, spot.id)
    if pending:
        in_use.update(request_photos(pending))
    to_destroy = [p for p in candidates if p not in in_use]
    destroy_cloudinary_images(to_destroy)
    return {"discarded": to_destroy}


# -------- Admin --------

@router.get("/admin/change-requests")
def list_pending_change_requests(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    pending = (
        db.query(SpotChangeRequest)
        .options(
            joinedload(SpotChangeRequest.spot).joinedload(SpotDB.category),
            joinedload(SpotChangeRequest.spot).joinedload(SpotDB.images),
        )
        .filter(SpotChangeRequest.status == "pending")
        .order_by(SpotChangeRequest.created_at.asc())
        .all()
    )
    # "current" va aparte de changes[campo]["from"]: si el admin editó el
    # spot mientras el pedido esperaba, el "antes" guardado quedó viejo y la
    # pantalla tiene que poder avisarlo.
    return [
        {
            **serialize_request(r),
            "requested_by": r.requested_by,
            "spot": {
                "id": r.spot.id,
                "name": r.spot.name,
                "slug": r.spot.slug,
                "department": r.spot.department,
                "category": r.spot.category,
                "images": r.spot.images,
                "current": {"name": r.spot.name, "description": r.spot.description},
            },
        }
        for r in pending
    ]


def _get_pending_or_404(db: Session, request_id: int) -> SpotChangeRequest:
    change = db.query(SpotChangeRequest).filter(SpotChangeRequest.id == request_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if change.status != "pending":
        raise HTTPException(status_code=409, detail="Este pedido ya fue resuelto.")
    return change


@router.post("/admin/change-requests/{request_id}/approve")
def approve_change_request(request_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    change = _get_pending_or_404(db, request_id)
    # Se revalida al aprobar: mientras el pedido esperaba, otro spot pudo
    # tomar el nombre o el admin pudo sumar fotos.
    if "name" in change.changes:
        assert_name_available(db, change.changes["name"]["to"], change.spot_id)
    photos = request_photos(change)
    if photos:
        assert_photo_limit(db, change.spot_id, len(photos))
    apply_request_to_spot(db, change)
    close_request(change, "approved", by=admin.get("email"))
    db.commit()
    return serialize_request(change)


@router.post("/admin/change-requests/{request_id}/reject")
def reject_change_request(request_id: int, body: ChangeRequestReject, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    change = _get_pending_or_404(db, request_id)
    photos = request_photos(change)
    reason = (body.reason or "").strip() or None
    close_request(change, "rejected", by=admin.get("email"), reason=reason)
    db.commit()
    destroy_cloudinary_images(photos)
    return serialize_request(change)
