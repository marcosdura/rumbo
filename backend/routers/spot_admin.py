"""Moderación de lugares (solo el admin): el listado del panel, aprobar,
rechazar, reactivar y borrar."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_admin_user
from ownership import is_admin_managed
from auth import ADMIN_EMAIL
from limiter import limiter
from models import SpotDB, SpotImage
from schemas import SpotReject
import models
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from slugs import generate_slug
from notifications import notify
from spot_changes import unpublish_spot, reject_spot as reject_spot_with_reason, get_pending_request, request_photos, destroy_cloudinary_images
import cloudinary
import os


router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


@router.delete("/spots/{spot_id}")
@limiter.limit("60/minute")
def delete_spot(request: Request, spot_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    # include_pending: el cascade del ORM borra lo que carga de las
    # relaciones; sin esto los aportes pendientes no se cargan y quedan
    # huérfanos (en Postgres los borra el ON DELETE CASCADE, pero no sus fotos).
    db_spot = db.query(SpotDB).execution_options(include_pending=True).filter(SpotDB.id == spot_id).first()
    if not db_spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    images = db.query(SpotImage).filter(SpotImage.spot_id == spot_id).all()
    # Las fotos de un pedido de cambio pendiente también están en Cloudinary
    # (sin fila en spot_images): el cascade borra el pedido, pero no el archivo.
    pending = get_pending_request(db, spot_id)
    # Fotos de rutas, sectores y vías (también las en revisión).
    item_photo_ids = [
        p.cloudinary_public_id
        for p in db.query(models.ItemPhoto).execution_options(include_pending=True).filter(models.ItemPhoto.spot_id == spot_id)
    ]
    destroy_cloudinary_images(
        item_photo_ids
        + [img.cloudinary_public_id for img in images]
        + (request_photos(pending) if pending else [])
    )

    # Antes esto era un DELETE FROM spots crudo, que rompía con
    # IntegrityError apenas el spot tenía cualquier fila asociada (reviews,
    # detalles, categorías, etc.) — ninguna FK tenía cascada. Ahora que los
    # relationships de SpotDB tienen cascade="all, delete-orphan", db.delete
    # hace que SQLAlchemy arme el orden de DELETEs solo.
    db.delete(db_spot)
    db.commit()

    return {"message": "Spot deleted"}


@router.get("/admin/spots")
def get_all_spots_admin(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    spots = (
        db.query(SpotDB)
        .options(
            joinedload(SpotDB.category),
            joinedload(SpotDB.images),
        )
        .order_by(SpotDB.is_approved.asc(), SpotDB.id.desc())
        .all()
    )
    spot_ids = [s.id for s in spots]
    review_counts = dict(
        db.query(models.Review.spot_id, func.count(models.Review.id))
        .filter(models.Review.spot_id.in_(spot_ids))
        .group_by(models.Review.spot_id)
        .all()
    ) if spot_ids else {}
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "department": s.department,
            # Para pedir el cambio de ubicación desde el panel.
            "lat": s.lat,
            "lng": s.lng,
            "is_approved": s.is_approved,
            "rejection_reason": s.rejection_reason,
            "rejected_at": s.rejected_at.isoformat() if s.rejected_at else None,
            "category": s.category,
            "images": s.images,
            "owner_email": s.owner_email,
            "owner_deleted_at": s.owner_deleted_at,
            "suggested_by_visitor": bool(s.suggested_by_visitor),
            "slug": s.slug,
            "created_at": s.created_at,
            "review_count": review_counts.get(s.id, 0),
        }
        for s in spots
    ]


@router.patch("/admin/spots/{spot_id}/reactivate")
@limiter.limit("60/minute")
def reactivate_spot(request: Request, spot_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    # No usa get_owned_spot_or_admin: si el spot está acá es porque su dueño
    # borró la cuenta, ya no hay ningún dueño legítimo que autorizar — es
    # una decisión exclusiva del admin.
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    spot.owner_deleted_at = None
    db.commit()
    return {"id": spot.id}


@router.patch("/admin/spots/{spot_id}/approve")
@limiter.limit("60/minute")
def approve_spot(request: Request, spot_id: int, approved: bool, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not approved:
        unpublish_spot(db, spot, by=admin.get("email"))
    was_approved = spot.is_approved
    spot.is_approved = approved
    if approved:
        # Aprobado: ya no hay rechazo que mostrarle al dueño.
        spot.rejection_reason = None
        spot.rejected_at = None
    # Una playa o laguna aprobada es un lugar público: pasa al admin. Quien
    # la sugirió sigue siendo dueño de su escuela, no de la playa. Lo mismo
    # un lugar que sugirió un visitante (no el responsable).
    # Antes del traspaso al admin: el aviso es para quien lo sugirió.
    owner_before = spot.owner_email
    if approved and is_admin_managed(spot) and ADMIN_EMAIL:
        spot.owner_email = ADMIN_EMAIL
    if approved and not spot.slug:
        spot.slug = generate_slug(spot.name)
    if approved and not was_approved and owner_before != admin.get("email"):
        if spot.suggested_by_visitor:
            notify(db, owner_before, "spot_approved", f"Se publicó «{spot.name}», el lugar que sugeriste", body="¡Gracias por sumarlo a Rumbo!", link=f"/spots/{spot.slug}")
        else:
            notify(db, owner_before, "spot_approved", f"Tu lugar «{spot.name}» fue aprobado", body="Ya está publicado en Rumbo.", link=f"/spots/{spot.slug}")
    db.commit()
    return {"id": spot.id, "is_approved": spot.is_approved}


@router.post("/admin/spots/{spot_id}/reject")
@limiter.limit("60/minute")
def reject_spot(request: Request, spot_id: int, body: SpotReject, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """Rechazar un spot nuevo, o despublicar uno aprobado, con un motivo que
    el dueño ve en su dashboard. Antes la única salida para un spot que no
    servía era borrarlo, sin explicación; "Eliminar" queda para el spam. El
    dueño corrige y lo vuelve a enviar (POST /spots/{id}/resubmit)."""
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    reject_spot_with_reason(db, spot, body.reason, by=admin.get("email"))
    db.commit()
    return {"id": spot.id, "is_approved": False, "rejection_reason": spot.rejection_reason}
