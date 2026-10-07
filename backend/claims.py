"""Reclamar un lugar sugerido por un visitante.

Un lugar que cargó un visitante (spots.suggested_by_visitor), una vez
aprobado lo maneja el admin y su página avisa que la información está a
confirmar. Su responsable o dueño puede reclamarlo: el pedido va a revisión
y, si el admin lo aprueba, el lugar pasa a ser suyo (lo administra desde su
perfil) y deja de figurar como sugerido. Se le avisa en la app en los dos
casos.
"""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import SpotClaim, SpotDB
from notifications import notify, notify_admin, spot_link


def claimable(spot: SpotDB) -> bool:
    return bool(spot.is_approved and spot.suggested_by_visitor and spot.owner_deleted_at is None)


def get_claimable_spot(db: Session, spot_id: int) -> SpotDB:
    spot = db.get(SpotDB, spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not claimable(spot):
        raise HTTPException(status_code=400, detail="Este lugar no se puede reclamar")
    return spot


def my_pending(db: Session, spot_id: int, email: str) -> SpotClaim | None:
    return (
        db.query(SpotClaim)
        .filter(SpotClaim.spot_id == spot_id, SpotClaim.user_email == email, SpotClaim.status == "pending")
        .first()
    )


def create_claim(db: Session, spot: SpotDB, email: str, message: str | None) -> SpotClaim:
    if my_pending(db, spot.id, email):
        raise HTTPException(status_code=409, detail="Ya tenés un pedido en revisión para este lugar")
    claim = SpotClaim(spot_id=spot.id, user_email=email, message=(message or "").strip() or None, status="pending")
    db.add(claim)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya tenés un pedido en revisión para este lugar")
    notify_admin(db, "admin_claim", f"Alguien reclama «{spot.name}» como responsable", body=email)
    return claim


def _pending_claim(db: Session, claim_id: int) -> SpotClaim:
    claim = db.get(SpotClaim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if claim.status != "pending":
        raise HTTPException(status_code=409, detail="Este pedido ya se resolvió")
    return claim


def approve(db: Session, claim_id: int) -> SpotClaim:
    claim = _pending_claim(db, claim_id)
    spot = db.get(SpotDB, claim.spot_id)
    now = datetime.now(timezone.utc)
    claim.status = "approved"
    claim.resolved_at = now
    spot.owner_email = claim.user_email
    spot.suggested_by_visitor = False
    notify(db, claim.user_email, "claim_approved", f"Ya sos el responsable de «{spot.name}»",
           body="Lo podés administrar desde tu perfil.", link=f"/dashboard/spots/{spot.id}")
    # El lugar ya tiene responsable: los demás pedidos quedan rechazados.
    others = (
        db.query(SpotClaim)
        .filter(SpotClaim.spot_id == spot.id, SpotClaim.status == "pending", SpotClaim.id != claim.id)
        .all()
    )
    for other in others:
        other.status = "rejected"
        other.reject_reason = "Se confirmó a otra persona como responsable."
        other.resolved_at = now
        notify(db, other.user_email, "claim_rejected", f"No se aprobó tu pedido sobre «{spot.name}»",
               body=other.reject_reason, link=spot_link(spot))
    return claim


def reject(db: Session, claim_id: int, reason: str) -> SpotClaim:
    claim = _pending_claim(db, claim_id)
    spot = db.get(SpotDB, claim.spot_id)
    claim.status = "rejected"
    claim.reject_reason = reason.strip()
    claim.resolved_at = datetime.now(timezone.utc)
    notify(db, claim.user_email, "claim_rejected", f"No se aprobó tu pedido sobre «{spot.name}»",
           body=claim.reject_reason, link=spot_link(spot))
    return claim
