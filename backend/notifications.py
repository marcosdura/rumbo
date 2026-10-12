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


# A qué pestaña del panel lleva cada aviso de admin (/admin?tab=...). Antes
# todos llevaban a /admin y había que buscar dónde estaba.
ADMIN_TABS = {
    "admin_new_spot": "nuevos",
    "admin_spot_resubmitted": "nuevos",
    "admin_change_request": "cambios",
    "admin_contribution": "cambios",
    "admin_operator_change": "cambios",
    "admin_report": "reportes",
    "admin_claim": "reclamos",
}


def admin_link(kind: str) -> str:
    tab = ADMIN_TABS.get(kind)
    return f"/admin?tab={tab}" if tab else "/admin"


def notify_admin(db: Session, kind: str, title: str, body: str | None = None):
    notify(db, ADMIN_EMAIL, kind, title, body, admin_link(kind))


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
