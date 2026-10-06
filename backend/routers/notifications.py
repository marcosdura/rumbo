from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import notifications
from auth import get_current_user_required
from database import get_db
from models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
def my_notifications(limit: int = 50, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    email = user.get("email")
    rows = (
        db.query(Notification)
        .filter(Notification.user_email == email)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(min(max(limit, 1), 100))
        .all()
    )
    unread = db.query(Notification).filter(Notification.user_email == email, Notification.read_at.is_(None)).count()
    return {"unread": unread, "items": [notifications.serialize(n) for n in rows]}


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Para la campanita: se consulta seguido, así que solo el número."""
    count = (
        db.query(Notification)
        .filter(Notification.user_email == user.get("email"), Notification.read_at.is_(None))
        .count()
    )
    return {"unread": count}


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    # 404 también si es de otro: no confirmar que existe.
    if not n or n.user_email != user.get("email"):
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    if n.read_at is None:
        n.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    (
        db.query(Notification)
        .filter(Notification.user_email == user.get("email"), Notification.read_at.is_(None))
        .update({"read_at": datetime.now(timezone.utc)}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True}
