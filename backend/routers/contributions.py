from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

import contributions
from auth import get_current_admin_user, get_current_user_required
from database import get_db
from limiter import limiter
from models import Contribution, SpotDB
from schemas import ContributionReject

router = APIRouter(tags=["contributions"])


def _spot_summary(spot: SpotDB) -> dict:
    return {
        "id": spot.id,
        "name": spot.name,
        "slug": spot.slug,
        "department": spot.department,
        "category": spot.category,
        "owner_email": spot.owner_email,
    }


# -------- Autor --------

@router.get("/contributions/mine")
def my_contributions(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Para "Tus aportes" en /profile: los pendientes, y los aprobados o
    rechazados que el autor todavía no cerró. Los retirados no se muestran."""
    rows = (
        db.query(Contribution)
        .options(joinedload(Contribution.spot).joinedload(SpotDB.category))
        .filter(
            Contribution.author_email == user.get("email"),
            Contribution.status.in_(["pending", "approved", "rejected"]),
            Contribution.author_dismissed_at.is_(None),
        )
        .order_by(Contribution.created_at.desc())
        .all()
    )
    return [{**contributions.serialize(db, c), "spot": _spot_summary(c.spot)} for c in rows]


def _own_contribution(db: Session, contribution_id: int, user: dict) -> Contribution:
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()
    # 404 también si es ajeno: no confirmar que existe.
    if not contribution or contribution.author_email != user.get("email"):
        raise HTTPException(status_code=404, detail="Aporte no encontrado")
    return contribution


@router.post("/contributions/{contribution_id}/withdraw")
@limiter.limit("20/minute")
def withdraw_contribution(request: Request, contribution_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    contribution = _own_contribution(db, contribution_id, user)
    if contribution.status != "pending":
        raise HTTPException(status_code=409, detail="Este aporte ya fue revisado.")
    photos = contributions.discard(db, contribution, "withdrawn", by=user.get("email"))
    db.commit()
    contributions.destroy_cloudinary_images(photos)
    return {"ok": True}


@router.post("/contributions/{contribution_id}/dismiss")
def dismiss_contribution(contribution_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    contribution = _own_contribution(db, contribution_id, user)
    if contribution.status == "pending":
        raise HTTPException(status_code=409, detail="Este aporte todavía está en revisión.")
    contribution.author_dismissed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


# -------- Admin --------

@router.get("/admin/contributions")
def list_pending_contributions(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    rows = (
        db.query(Contribution)
        .options(joinedload(Contribution.spot).joinedload(SpotDB.category))
        .filter(Contribution.status == "pending")
        .order_by(Contribution.created_at.asc())
        .all()
    )
    return [
        {**contributions.serialize(db, c, with_item=True), "author_email": c.author_email, "spot": _spot_summary(c.spot)}
        for c in rows
    ]


def _pending_or_404(db: Session, contribution_id: int) -> Contribution:
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()
    if not contribution:
        raise HTTPException(status_code=404, detail="Aporte no encontrado")
    if contribution.status != "pending":
        raise HTTPException(status_code=409, detail="Este aporte ya fue resuelto.")
    return contribution


@router.post("/admin/contributions/{contribution_id}/approve")
def approve_contribution(contribution_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    contribution = _pending_or_404(db, contribution_id)
    contributions.approve(db, contribution, by=admin.get("email"))
    db.commit()
    return contributions.serialize(db, contribution)


@router.post("/admin/contributions/{contribution_id}/reject")
def reject_contribution(contribution_id: int, body: ContributionReject, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    contribution = _pending_or_404(db, contribution_id)
    reason = (body.reason or "").strip() or None
    photos = contributions.discard(db, contribution, "rejected", by=admin.get("email"), reason=reason)
    db.commit()
    # Después del commit, como en el resto: si el destroy falla, queda un
    # huérfano en Cloudinary (logueado) y no una fila apuntando a nada.
    contributions.destroy_cloudinary_images(photos)
    return contributions.serialize(db, contribution)
