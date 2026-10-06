"""Reportes: un usuario avisa que algo publicado está mal (información falsa,
contenido ofensivo, spam, fotos que no corresponden, un lugar que cerró).

- Se reportan spots, reseñas (de spot, surf y kayak) y escuelas/kayaks.
- Solo con sesión; un reporte abierto por persona y cosa reportada; no se
  reporta lo propio.
- Nada se oculta por cantidad de reportes: los reportes solo avisan y
  siempre decide el admin (si no, un grupo podría bajar un lugar ajeno
  reportándolo entre todos).
- El admin descarta, despublica un spot (con motivo, que ve el dueño) o
  borra una reseña / escuela. La acción cierra todos los reportes abiertos
  de esa cosa.
"""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

import contributions
import operators
from models import KayakDetail, KayakReview, Report, Review, SpotDB, SurfReview, SurfSchool, User
from spot_changes import reject_spot

REASONS = {
    "false_info": "Información falsa o engañosa",
    "offensive": "Contenido ofensivo o inapropiado",
    "spam": "Spam o publicidad",
    "wrong_photos": "Fotos que no corresponden",
    "closed": "El lugar ya no existe o cerró",
    "other": "Otro",
}

REVIEW_KINDS = {"review": Review, "surf_review": SurfReview, "kayak_review": KayakReview}
OPERATOR_KINDS = {"surf_school": SurfSchool, "kayak": KayakDetail}
TARGET_KINDS = {"spot", *REVIEW_KINDS, *OPERATOR_KINDS}

# Qué acciones tiene sentido ofrecer sobre cada cosa reportada.
ACTIONS = {
    "spot": {"dismiss", "unpublish"},
    "review": {"dismiss", "delete"},
    "surf_review": {"dismiss", "delete"},
    "kayak_review": {"dismiss", "delete"},
    "surf_school": {"dismiss", "delete"},
    "kayak": {"dismiss", "delete"},
}


def get_target(db: Session, kind: str, target_id: int):
    """La cosa reportada, o None si ya no existe (o no está publicada)."""
    if kind == "spot":
        return db.query(SpotDB).filter(SpotDB.id == target_id).first()
    model = REVIEW_KINDS.get(kind) or OPERATOR_KINDS.get(kind)
    if not model:
        raise HTTPException(status_code=422, detail="Tipo de reporte desconocido")
    return db.query(model).filter(model.id == target_id).first()


def spot_of(kind: str, target) -> SpotDB:
    if kind == "spot":
        return target
    if kind == "review":
        return target.spot
    if kind == "surf_review":
        return target.surf_school.spot
    if kind == "kayak_review":
        return target.kayak_detail.spot
    return target.spot  # surf_school / kayak


def is_own(db: Session, kind: str, target, email: str) -> bool:
    if kind == "spot":
        return target.owner_email == email
    if kind in REVIEW_KINDS:
        user = db.query(User).filter(User.id == target.user_id).first()
        return bool(user and user.email == email)
    return target.owner_email == email


def create_report(db: Session, user: dict, kind: str, target_id: int, reason: str, comment: str | None) -> Report:
    if kind not in TARGET_KINDS:
        raise HTTPException(status_code=422, detail="Tipo de reporte desconocido")
    if reason not in REASONS:
        raise HTTPException(status_code=422, detail="Motivo desconocido")
    comment = (comment or "").strip() or None
    if reason == "other" and not comment:
        raise HTTPException(status_code=422, detail="Contanos qué pasa: con \"Otro\" el comentario es obligatorio.")

    target = get_target(db, kind, target_id)
    spot = spot_of(kind, target) if target else None
    # Solo se reporta lo que está publicado (lo que el usuario pudo ver).
    if not target or not spot or not spot.is_approved or spot.owner_deleted_at is not None:
        raise HTTPException(status_code=404, detail="No encontramos lo que querés reportar.")
    email = user.get("email")
    if is_own(db, kind, target, email):
        raise HTTPException(status_code=400, detail="No podés reportar algo tuyo.")

    existing = (
        db.query(Report)
        .filter_by(reporter_email=email, target_kind=kind, target_id=target_id, status="open")
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya lo reportaste: lo estamos revisando.")

    report = Report(
        target_kind=kind, target_id=target_id, spot_id=spot.id,
        reporter_email=email, reason=reason, comment=comment, status="open",
    )
    db.add(report)
    db.commit()
    return report


def describe_target(db: Session, kind: str, target) -> dict:
    """Lo que el admin necesita ver de la cosa reportada."""
    if target is None:
        return {"exists": False}
    spot = spot_of(kind, target)
    data = {
        "exists": True,
        "spot": {"id": spot.id, "name": spot.name, "slug": spot.slug, "is_approved": spot.is_approved},
    }
    if kind == "spot":
        data.update(title=target.name, owner_email=target.owner_email)
    elif kind in REVIEW_KINDS:
        user = db.query(User).filter(User.id == target.user_id).first()
        data.update(
            title=f"Reseña de {user.name if user and user.name else 'un usuario'}",
            rating=target.rating, comment=target.comment,
            owner_email=user.email if user else None,
        )
        if kind != "review":
            parent = target.surf_school if kind == "surf_review" else target.kayak_detail
            data["parent_name"] = parent.name
    else:
        data.update(title=target.name, owner_email=target.owner_email)
    return data


def close_reports(db: Session, kind: str, target_id: int, status: str, resolution: str, by: str):
    now = datetime.now(timezone.utc)
    (
        db.query(Report)
        .filter_by(target_kind=kind, target_id=target_id, status="open")
        .update({"status": status, "resolution": resolution, "resolved_at": now, "resolved_by": by}, synchronize_session=False)
    )


def resolve(db: Session, admin: dict, kind: str, target_id: int, action: str, reason: str | None):
    """Devuelve los public_id de Cloudinary a destruir después del commit."""
    if kind not in ACTIONS:
        raise HTTPException(status_code=422, detail="Tipo de reporte desconocido")
    if action not in ACTIONS[kind]:
        raise HTTPException(status_code=422, detail="Esa acción no aplica a esto.")
    open_count = db.query(Report).filter_by(target_kind=kind, target_id=target_id, status="open").count()
    if not open_count:
        raise HTTPException(status_code=404, detail="No hay reportes abiertos sobre esto.")

    by = admin.get("email")
    photos = []
    if action == "dismiss":
        close_reports(db, kind, target_id, "dismissed", "dismissed", by)
        return photos

    target = get_target(db, kind, target_id)
    if target is None:
        # Ya no existe (lo borró su autor, por ejemplo): no hay nada que hacer.
        close_reports(db, kind, target_id, "dismissed", "dismissed", by)
        return photos

    if action == "unpublish":
        if not (reason or "").strip():
            raise HTTPException(status_code=422, detail="Escribí el motivo: es lo que va a ver el dueño.")
        reject_spot(db, target, reason, by=by)
        close_reports(db, kind, target_id, "actioned", "unpublished", by)
    else:  # delete
        if kind in OPERATOR_KINDS:
            photos += operators.cancel_pending_change(db, kind, target.id, by=by)
            photos += contributions.delete_item(db, kind, target, by=by)
        else:
            db.delete(target)
        close_reports(db, kind, target_id, "actioned", "deleted", by)
    return photos
