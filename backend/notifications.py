"""Notificaciones dentro de la app: avisos sobre lo que le pasa a lo tuyo
(un spot aprobado, un aporte rechazado, una reseña nueva...) y, para el
admin, lo nuevo para revisar. Se ven en la campanita del Navbar.

Solo dentro de la app a propósito: sin email ni push, para no depender de
servicios con tope gratuito.

notify() no hace commit: la notificación se guarda en la misma transacción
que el evento que la genera, así no queda un aviso de algo que no pasó.
"""
from sqlalchemy.orm import Session

from auth import ADMIN_EMAIL
from models import Notification


def notify(db: Session, email: str | None, kind: str, title: str, body: str | None = None, link: str | None = None):
    if not email:
        return
    db.add(Notification(user_email=email, kind=kind, title=title, body=body, link=link))


def notify_admin(db: Session, kind: str, title: str, body: str | None = None, link: str = "/admin"):
    notify(db, ADMIN_EMAIL, kind, title, body, link)


def spot_link(spot) -> str:
    return f"/spots/{spot.slug}" if spot.slug and spot.is_approved else f"/dashboard/spots/{spot.id}"


def serialize(n: Notification) -> dict:
    return {
        "id": n.id,
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "link": n.link,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "read": n.read_at is not None,
    }
