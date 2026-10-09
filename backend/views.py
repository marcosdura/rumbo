"""Visitas a la página de un lugar, para la métrica de populares.

Una por persona, por lugar y por día (índice único). No se guardan IPs ni
emails: solo un hash de "quién" con el día y una sal, que no se puede
revertir y cambia todos los días (no sirve para seguir a nadie). Los bots
que se identifican como tales no cuentan.

Por ahora solo se junta: home.py la sumará a la puntuación de populares
cuando haya un mes de datos.
"""
import hashlib
import os
import re
from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import SpotView

SALT = os.environ.get("VIEW_HASH_SALT", "rumbo-visitas")

BOT_UA = re.compile(r"bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse", re.I)


def is_bot(user_agent: str | None) -> bool:
    return not user_agent or bool(BOT_UA.search(user_agent))


def viewer_hash(identity: str, day: date) -> str:
    return hashlib.sha256(f"{day.isoformat()}|{identity}|{SALT}".encode()).hexdigest()


def record_view(db: Session, spot_id: int, identity: str, day: date | None = None) -> bool:
    """Registra la visita; False si esa persona ya lo había visto hoy."""
    day = day or date.today()
    db.add(SpotView(spot_id=spot_id, day=day, viewer_hash=viewer_hash(identity, day)))
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False


STATS_DAYS = 30


def owner_stats(db: Session, spot_id: int, today: date | None = None) -> dict:
    """Para el panel del dueño: personas que vieron la página en los últimos
    30 días (una por día, como se cuentan) y cuántos lo tienen en favoritos."""
    from datetime import timedelta
    from models import Favorite
    today = today or date.today()
    since = today - timedelta(days=STATS_DAYS - 1)
    return {
        "views_30d": db.query(SpotView).filter(SpotView.spot_id == spot_id, SpotView.day >= since).count(),
        "favorites": db.query(Favorite).filter(Favorite.spot_id == spot_id).count(),
    }
