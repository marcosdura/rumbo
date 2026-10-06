from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

import operators
from auth import get_current_admin_user, get_current_user_required, is_admin
from contributions import pending_contribution_for
from database import get_db
from limiter import limiter
from models import KayakDetail, OperatorChangeRequest, SpotDB, SurfSchool
from schemas import ChangeRequestReject, DiscardPhotosRequest, KayakDetailResponse, OperatorEditRequest, SurfSchoolResponse
from contributions import is_own_new_photo_id_url

router = APIRouter(tags=["operators"])

RESPONSE_SCHEMAS = {"surf_school": SurfSchoolResponse, "kayak": KayakDetailResponse}


def _owner_view(db: Session, kind: str, operator) -> dict:
    """Lo que ve el dueño en su dashboard y en "Tus escuelas"."""
    change = operators.owner_visible_change(db, kind, operator.id)
    contribution = pending_contribution_for(db, kind, operator.id)
    spot = operator.spot
    return {
        **RESPONSE_SCHEMAS[kind].model_validate(operator).model_dump(mode="json"),
        "kind": kind,
        "spot": {"id": spot.id, "name": spot.name, "slug": spot.slug, "is_approved": spot.is_approved},
        # El operador recién sumado, todavía en revisión como aporte.
        "contribution_id": contribution.id if contribution else None,
        "change_request": operators.serialize_change(change) if change else None,
    }


def _managed_operator(db: Session, kind: str, operator_id: int, user: dict):
    operator = operators.get_operator(db, kind, operator_id)
    operators.assert_can_manage_operator(operator, operator.spot, user)
    return operator


# -------- Dueño --------

@router.get("/operators/mine")
def my_operators(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """"Tus escuelas" en /profile: escuelas de surf y servicios de kayak de
    los que el usuario es dueño, incluidos los que están en revisión."""
    email = user.get("email")
    result = []
    for kind, model in operators.OPERATOR_MODELS.items():
        rows = (
            db.query(model)
            .execution_options(include_pending=True)
            .options(joinedload(model.spot))
            .filter(model.owner_email == email)
            .order_by(model.id)
            .all()
        )
        result += [_owner_view(db, kind, op) for op in rows]
    return result


@router.get("/operators/{kind}/{operator_id}")
def get_my_operator(kind: str, operator_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    operator = _managed_operator(db, kind, operator_id, user)
    return _owner_view(db, kind, operator)


@router.patch("/operators/{kind}/{operator_id}")
@limiter.limit("20/minute")
def edit_operator(
    request: Request,
    kind: str,
    operator_id: int,
    body: OperatorEditRequest,
    dry_run: bool = False,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    """Mismo criterio que PATCH /admin/spots/{id}: nombre y fotos nuevas a
    revisión (si el operador ya está publicado), el resto al instante.
    dry_run=true devuelve la clasificación sin escribir nada."""
    operator = _managed_operator(db, kind, operator_id, user)
    plan = operators.plan_operator_edit(db, kind, operator, body.model_dump(exclude_unset=True), admin=is_admin(user))
    applied, pending = list(plan["apply"].keys()), list(plan["pending"].keys())
    if dry_run:
        return {"id": operator.id, "applied": applied, "pending": pending}
    change = operators.execute_operator_edit(db, kind, operator, plan, requested_by=user.get("email"))
    return {
        "id": operator.id,
        "applied": applied,
        "pending": pending,
        "change_request": operators.serialize_change(change) if change else None,
    }


@router.post("/operators/{kind}/{operator_id}/change-request/cancel")
@limiter.limit("20/minute")
def cancel_operator_change(request: Request, kind: str, operator_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    operator = _managed_operator(db, kind, operator_id, user)
    change = operators.get_pending_change(db, kind, operator.id)
    if not change:
        raise HTTPException(status_code=404, detail="No hay ningún cambio en revisión.")
    photos = operators.discard_change(change, "cancelled", by=user.get("email"))
    db.commit()
    operators.destroy_cloudinary_images(photos)
    return {"ok": True}


@router.post("/operators/{kind}/{operator_id}/change-request/dismiss")
def dismiss_operator_change(kind: str, operator_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    operator = _managed_operator(db, kind, operator_id, user)
    (
        db.query(OperatorChangeRequest)
        .filter(
            OperatorChangeRequest.kind == kind,
            OperatorChangeRequest.operator_id == operator.id,
            OperatorChangeRequest.status.in_(["approved", "rejected"]),
            OperatorChangeRequest.owner_dismissed_at.is_(None),
        )
        .update({"owner_dismissed_at": datetime.now(timezone.utc)}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True}


@router.post("/operators/{kind}/{operator_id}/discard-photos")
@limiter.limit("20/minute")
def discard_operator_photos(request: Request, kind: str, operator_id: int, body: DiscardPhotosRequest, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Si el guardado falló después de subir fotos nuevas, el dashboard las
    manda a borrar acá. Solo las de la carpeta de su playa que no use el
    operador ni su pedido pendiente."""
    operator = _managed_operator(db, kind, operator_id, user)
    in_use = set(operators.current_photos(operator))
    change = operators.get_pending_change(db, kind, operator.id)
    if change and "photos" in change.changes:
        in_use |= set(change.changes["photos"]["to"])
    to_destroy = [
        pid for url in body.public_ids
        if url not in in_use and (pid := is_own_new_photo_id_url(operator.spot_id, url))
    ]
    operators.destroy_cloudinary_images(to_destroy)
    return {"discarded": to_destroy}


# -------- Admin --------

@router.get("/admin/operator-change-requests")
def list_operator_changes(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    rows = (
        db.query(OperatorChangeRequest)
        .options(joinedload(OperatorChangeRequest.spot))
        .filter(OperatorChangeRequest.status == "pending")
        .order_by(OperatorChangeRequest.created_at.asc())
        .all()
    )
    result = []
    for r in rows:
        operator = operators.get_operator(db, r.kind, r.operator_id)
        result.append({
            **operators.serialize_change(r),
            "requested_by": r.requested_by,
            "spot": {"id": r.spot.id, "name": r.spot.name, "slug": r.spot.slug},
            # Valor de hoy: si difiere del "from", se editó mientras esperaba.
            "operator": {"name": operator.name, "photos": operators.current_photos(operator)},
        })
    return result


def _pending_change_or_404(db: Session, request_id: int) -> OperatorChangeRequest:
    change = db.query(OperatorChangeRequest).filter(OperatorChangeRequest.id == request_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if change.status != "pending":
        raise HTTPException(status_code=409, detail="Este pedido ya fue resuelto.")
    return change


@router.post("/admin/operator-change-requests/{request_id}/approve")
def approve_operator_change(request_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    change = _pending_change_or_404(db, request_id)
    removed = operators.approve_change(db, change, by=admin.get("email"))
    db.commit()
    operators.destroy_cloudinary_images(removed)
    return operators.serialize_change(change)


@router.post("/admin/operator-change-requests/{request_id}/reject")
def reject_operator_change(request_id: int, body: ChangeRequestReject, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    change = _pending_change_or_404(db, request_id)
    reason = (body.reason or "").strip() or None
    photos = operators.discard_change(change, "rejected", by=admin.get("email"), reason=reason)
    db.commit()
    operators.destroy_cloudinary_images(photos)
    return operators.serialize_change(change)
