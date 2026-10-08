"""Lo del usuario para /profile: el resumen y los números del menú, sus
pedidos (cambios en sus lugares y escuelas, y pedidos para hacerse cargo de
un lugar) y los lugares que sugirió como visitante."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import operators
from auth import get_current_user_required, is_admin
from database import get_db
from models import Contribution, Favorite, Review, SpotClaim, SpotDB, User
from ownership import is_admin_managed
from spot_changes import owner_visible_request

router = APIRouter(prefix="/me", tags=["me"])


def managed_spots(db: Session, user: dict) -> list[SpotDB]:
    """Los lugares que administra (los mismos que /spots/mine): un lugar que
    pasó al admin (playa, o sugerido como visitante) ya no es suyo."""
    rows = db.query(SpotDB).filter(SpotDB.owner_email == user.get("email")).order_by(SpotDB.created_at.desc()).all()
    return [s for s in rows if is_admin(user) or not (is_admin_managed(s) and s.is_approved)]


def owned_operators(db: Session, email: str) -> list[tuple[str, object]]:
    found = []
    for kind, model in operators.OPERATOR_MODELS.items():
        rows = db.query(model).execution_options(include_pending=True).filter(model.owner_email == email).order_by(model.id).all()
        found += [(kind, op) for op in rows]
    return found


def _iso(dt):
    return dt.isoformat() if dt else None


def my_requests(db: Session, user: dict) -> list[dict]:
    """Los pedidos que esperan revisión, y los resueltos que todavía no cerró.
    Cada uno dice cómo se cierra su aviso (dismiss_url)."""
    email = user.get("email")
    items = []
    for spot in managed_spots(db, user):
        r = owner_visible_request(db, spot.id)
        if r:
            items.append({
                "kind": "spot_change", "id": r.id, "status": r.status,
                "fields": sorted((r.changes or {}).keys()),
                "target": {"name": spot.name, "href": f"/dashboard/spots/{spot.id}"},
                "reject_reason": r.reject_reason,
                "created_at": _iso(r.created_at), "resolved_at": _iso(r.resolved_at),
                "dismiss_url": f"/spots/{spot.id}/change-request/dismiss",
            })
    for kind, op in owned_operators(db, email):
        r = operators.owner_visible_change(db, kind, op.id)
        if r:
            items.append({
                "kind": "operator_change", "id": r.id, "status": r.status,
                "fields": sorted((r.changes or {}).keys()),
                "target": {"name": op.name, "href": f"/dashboard/operadores/{kind}/{op.id}"},
                "reject_reason": r.reject_reason,
                "created_at": _iso(r.created_at), "resolved_at": _iso(r.resolved_at),
                "dismiss_url": f"/operators/{kind}/{op.id}/change-request/dismiss",
            })
    claims = (
        db.query(SpotClaim).options(joinedload(SpotClaim.spot))
        .filter(SpotClaim.user_email == email, SpotClaim.user_dismissed_at.is_(None))
        .order_by(SpotClaim.created_at.desc()).all()
    )
    for c in claims:
        spot = c.spot
        items.append({
            "kind": "claim", "id": c.id, "status": c.status, "fields": [],
            "target": {
                "name": spot.name,
                "href": f"/dashboard/spots/{spot.id}" if c.status == "approved" else (f"/spots/{spot.slug}" if spot.slug else None),
            },
            "reject_reason": c.reject_reason,
            "created_at": _iso(c.created_at), "resolved_at": _iso(c.resolved_at),
            "dismiss_url": f"/me/claims/{c.id}/dismiss",
        })
    # Lo que espera revisión primero; después lo resuelto, lo más nuevo arriba.
    items.sort(key=lambda i: (i["status"] != "pending", -(datetime.fromisoformat(i["resolved_at"] or i["created_at"] or "1970-01-01").timestamp())))
    return items


def _status(spot: SpotDB) -> str:
    if spot.is_approved:
        return "approved"
    return "rejected" if spot.rejected_at else "pending"


def my_suggested(db: Session, email: str) -> list[dict]:
    rows = (
        db.query(SpotDB).options(joinedload(SpotDB.category), joinedload(SpotDB.images))
        .filter(SpotDB.suggested_by_email == email, SpotDB.owner_deleted_at.is_(None))
        .order_by(SpotDB.created_at.desc()).all()
    )
    result = []
    for s in rows:
        main = next((i for i in s.images if i.is_main), s.images[0] if s.images else None)
        result.append({
            "id": s.id, "name": s.name, "slug": s.slug if s.is_approved else None,
            "category": s.category.name if s.category else None, "department": s.department,
            "status": _status(s), "rejection_reason": s.rejection_reason,
            "image": main.cloudinary_public_id if main else None,
        })
    return result


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Los números del perfil: el resumen de arriba y cada fila del menú."""
    email, sub = user.get("email"), user.get("sub")
    db_user = db.query(User).filter(User.id == sub).first()
    spots = managed_spots(db, user)
    contributions = db.query(Contribution).filter(
        Contribution.author_email == email,
        Contribution.status.in_(["pending", "approved", "rejected"]),
        Contribution.author_dismissed_at.is_(None),
    ).all()
    requests = my_requests(db, user)
    return {
        "member_since": _iso(db_user.created_at) if db_user else None,
        "favorites": db.query(Favorite).filter(Favorite.user_id == sub).count(),
        "reviews": db.query(Review).filter(Review.user_id == sub).count(),
        # Un lugar sugerido en revisión es suyo mientras se revisa, pero se
        # cuenta (y se muestra) en "sugeridos", no dos veces.
        "managed": sum(1 for s in spots if s.suggested_by_email != email) + len(owned_operators(db, email)),
        "managed_rejected": sum(1 for s in spots if not s.is_approved and s.rejected_at),
        "suggested": db.query(SpotDB).filter(SpotDB.suggested_by_email == email, SpotDB.owner_deleted_at.is_(None)).count(),
        "contributions": len(contributions),
        "contributions_pending": sum(1 for c in contributions if c.status == "pending"),
        "requests": len(requests),
        "requests_pending": sum(1 for r in requests if r["status"] == "pending"),
    }


@router.get("/requests")
def requests(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    return my_requests(db, user)


@router.post("/claims/{claim_id}/dismiss")
def dismiss_claim(claim_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    claim = db.get(SpotClaim, claim_id)
    # 404 también si es ajeno: no confirmar que existe.
    if not claim or claim.user_email != user.get("email"):
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if claim.status == "pending":
        raise HTTPException(status_code=409, detail="Todavía está en revisión")
    claim.user_dismissed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.get("/suggested")
def suggested(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    return my_suggested(db, user.get("email"))
