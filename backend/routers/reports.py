from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import reports
from auth import get_current_admin_user, get_current_user_required
from database import get_db
from limiter import limiter
from models import Report
from schemas import ReportCreate, ReportResolve
from spot_changes import destroy_cloudinary_images

router = APIRouter(tags=["reports"])


@router.get("/reports/reasons")
def report_reasons():
    """Los motivos para elegir, en el orden en que se muestran."""
    return [{"value": k, "label": v} for k, v in reports.REASONS.items()]


@router.post("/reports", status_code=201)
@limiter.limit("10/minute")
def create_report(request: Request, body: ReportCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    reports.create_report(db, user, body.target_kind, body.target_id, body.reason, body.comment)
    # Quien reporta solo ve un "gracias": no se le expone qué decide el admin.
    return {"ok": True}


@router.get("/admin/reports")
def list_open_reports(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """Los reportes abiertos, agrupados por cosa reportada (la más reportada
    primero): una persona o diez reportando lo mismo es una sola decisión."""
    rows = db.query(Report).filter(Report.status == "open").order_by(Report.created_at.asc()).all()
    groups = defaultdict(list)
    for r in rows:
        groups[(r.target_kind, r.target_id)].append(r)

    result = []
    for (kind, target_id), items in groups.items():
        target = reports.get_target(db, kind, target_id)
        result.append({
            "target_kind": kind,
            "target_id": target_id,
            "target": reports.describe_target(db, kind, target),
            "actions": sorted(reports.ACTIONS[kind]),
            "count": len(items),
            "reasons": {r: sum(1 for i in items if i.reason == r) for r in {i.reason for i in items}},
            "reports": [
                {
                    "id": i.id,
                    "reason": i.reason,
                    "reason_label": reports.REASONS[i.reason],
                    "comment": i.comment,
                    "reporter_email": i.reporter_email,
                    "created_at": i.created_at.isoformat() if i.created_at else None,
                }
                for i in items
            ],
        })
    result.sort(key=lambda g: -g["count"])
    return result


@router.post("/admin/reports/resolve")
def resolve_reports(body: ReportResolve, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    photos = reports.resolve(db, admin, body.target_kind, body.target_id, body.action, body.reason)
    db.commit()
    destroy_cloudinary_images(photos)
    return {"ok": True}


@router.delete("/admin/reviews/{kind}/{review_id}")
def admin_delete_review(kind: str, review_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """El admin borra cualquier reseña (antes solo podía su autor: una
    reseña ofensiva quedaba para siempre). Cierra sus reportes abiertos."""
    model = reports.REVIEW_KINDS.get(kind)
    if not model:
        raise HTTPException(status_code=404, detail="Tipo de reseña desconocido")
    review = db.query(model).filter(model.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    reports.notify_review_deleted(db, review)
    db.delete(review)
    reports.close_reports(db, kind, review_id, "actioned", "deleted", by=admin.get("email"))
    db.commit()
    return {"ok": True}
