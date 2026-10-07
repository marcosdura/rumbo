from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

import claims
from auth import get_current_admin_user, get_current_user_required
from database import get_db
from limiter import limiter
from models import SpotClaim, SpotDB
from schemas import ClaimCreate, ClaimReject

router = APIRouter(tags=["claims"])


@router.post("/spots/{spot_id}/claims", status_code=201)
@limiter.limit("5/minute")
def create_claim(request: Request, spot_id: int, body: ClaimCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    spot = claims.get_claimable_spot(db, spot_id)
    claim = claims.create_claim(db, spot, user["email"], body.message)
    db.commit()
    return {"id": claim.id, "status": claim.status}


@router.get("/spots/{spot_id}/claims/mine")
def my_claim(spot_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Para la página del lugar: si ya pidió reclamarlo, se le muestra que
    está en revisión en vez del botón."""
    return {"pending": claims.my_pending(db, spot_id, user["email"]) is not None}


@router.get("/admin/claims")
def list_pending_claims(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    rows = (
        db.query(SpotClaim, SpotDB)
        .join(SpotDB, SpotDB.id == SpotClaim.spot_id)
        .filter(SpotClaim.status == "pending")
        .order_by(SpotClaim.created_at.asc())
        .all()
    )
    return [
        {
            "id": c.id,
            "user_email": c.user_email,
            "message": c.message,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "spot": {"id": s.id, "name": s.name, "slug": s.slug, "department": s.department},
        }
        for c, s in rows
    ]


@router.post("/admin/claims/{claim_id}/approve")
def approve_claim(claim_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    claim = claims.approve(db, claim_id)
    db.commit()
    return {"id": claim.id, "status": claim.status}


@router.post("/admin/claims/{claim_id}/reject")
def reject_claim(claim_id: int, body: ClaimReject, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    claim = claims.reject(db, claim_id, body.reason)
    db.commit()
    return {"id": claim.id, "status": claim.status}
