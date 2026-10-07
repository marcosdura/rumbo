"""La página principal: populares, recién agregados y colecciones al azar.

Populares (siempre arriba) — una puntuación con datos que se pueden
verificar, no inventada:
- cada favorito suma 1, y cada reseña suma 2 × (estrellas / 5);
- lo reciente pesa más: un favorito vale la mitad a los 30 días y una
  reseña a los 60 (se miran los últimos 180 y 365 días);
- no cuentan los favoritos ni las reseñas del propio dueño;
- para entrar hacen falta al menos MIN_SIGNALS (favoritos + reseñas).
Si no alcanzan para llenar la fila, se completa con otros lugares (al azar
del día). Las visitas (views.py) se suman cuando haya un mes de datos.

Colecciones: una por departamento y una por categoría, si tienen al menos
MIN_COLLECTION_SPOTS lugares. Se sortean RANDOM_COLLECTIONS por día (misma
selección todo el día, así la página se puede cachear), y el orden de los
lugares dentro de cada una también.
"""
import random
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session

from models import Category, Favorite, Review, SpotCategory, SpotDB, User

SECTION_SIZE = 8
RANDOM_COLLECTIONS = 3
MIN_COLLECTION_SPOTS = 3
MIN_SIGNALS = 2

FAVORITE_WINDOW_DAYS, FAVORITE_HALF_LIFE = 180, 30
REVIEW_WINDOW_DAYS, REVIEW_HALF_LIFE = 365, 60
REVIEW_WEIGHT = 2.0

CATEGORY_TITLES = {
    "Camping": "Campings", "Glamping": "Glampings", "Trekking": "Trekking",
    "Escalada": "Escalada", "Surf": "Surf", "Kayak": "Kayak", "Motorhome": "Para motorhomes",
}


def visible(query):
    return query.filter(SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))  # noqa: E712


def _aware(dt: datetime) -> datetime:
    # SQLite devuelve fechas sin zona; Postgres, con zona.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _decay(created_at: datetime | None, now: datetime, half_life: int) -> float:
    if created_at is None:
        return 0.0
    age_days = max((now - _aware(created_at)).total_seconds() / 86400, 0)
    return 0.5 ** (age_days / half_life)


def popularity(db: Session, now: datetime | None = None) -> dict[int, float]:
    """Puntuación de cada lugar publicado con al menos MIN_SIGNALS señales."""
    now = now or datetime.now(timezone.utc)
    not_owner = or_(SpotDB.owner_email.is_(None), User.email != SpotDB.owner_email)
    score: dict[int, float] = defaultdict(float)
    signals: dict[int, int] = defaultdict(int)

    favs = visible(
        db.query(Favorite.spot_id, Favorite.created_at)
        .join(SpotDB, SpotDB.id == Favorite.spot_id)
        .join(User, User.id == Favorite.user_id)
        .filter(not_owner, Favorite.created_at >= now - timedelta(days=FAVORITE_WINDOW_DAYS))
    ).all()
    for spot_id, created_at in favs:
        score[spot_id] += _decay(created_at, now, FAVORITE_HALF_LIFE)
        signals[spot_id] += 1

    reviews = visible(
        db.query(Review.spot_id, Review.created_at, Review.rating)
        .join(SpotDB, SpotDB.id == Review.spot_id)
        .join(User, User.id == Review.user_id)
        .filter(not_owner, Review.created_at >= now - timedelta(days=REVIEW_WINDOW_DAYS))
    ).all()
    for spot_id, created_at, rating in reviews:
        score[spot_id] += REVIEW_WEIGHT * (rating / 5) * _decay(created_at, now, REVIEW_HALF_LIFE)
        signals[spot_id] += 1

    return {spot_id: s for spot_id, s in score.items() if signals[spot_id] >= MIN_SIGNALS}


def popular_ids(db: Session, rng: random.Random, now: datetime | None = None) -> list[int]:
    scores = popularity(db, now)
    ranked = sorted(scores, key=lambda sid: (-scores[sid], sid))[:SECTION_SIZE]
    if len(ranked) < SECTION_SIZE:
        others = [sid for (sid,) in visible(db.query(SpotDB.id)).order_by(SpotDB.id).all() if sid not in scores]
        rng.shuffle(others)
        ranked += others[:SECTION_SIZE - len(ranked)]
    return ranked


def recent_ids(db: Session) -> list[int]:
    rows = visible(db.query(SpotDB.id)).order_by(SpotDB.created_at.desc(), SpotDB.id.desc()).limit(SECTION_SIZE).all()
    return [sid for (sid,) in rows]


def eligible_collections(db: Session) -> list[dict]:
    """Departamentos y categorías con al menos MIN_COLLECTION_SPOTS lugares."""
    found = []
    departments = (
        visible(db.query(SpotDB.department, func.count(SpotDB.id)))
        .filter(SpotDB.department.isnot(None))
        .group_by(SpotDB.department).all()
    )
    for name, total in departments:
        if total >= MIN_COLLECTION_SPOTS:
            found.append({"kind": "department", "name": name, "total": total})
    categories = (
        visible(
            db.query(Category.name, func.count(distinct(SpotCategory.spot_id)))
            .join(SpotCategory, SpotCategory.category_id == Category.id)
            .join(SpotDB, SpotDB.id == SpotCategory.spot_id)
        )
        .group_by(Category.name).all()
    )
    for name, total in categories:
        if total >= MIN_COLLECTION_SPOTS:
            found.append({"kind": "category", "name": name, "total": total})
    return sorted(found, key=lambda c: (c["kind"], c["name"]))


def collection_spot_ids(db: Session, collection: dict, rng: random.Random) -> list[int]:
    query = visible(db.query(SpotDB.id))
    if collection["kind"] == "department":
        query = query.filter(SpotDB.department == collection["name"])
    else:
        query = (
            query.join(SpotCategory, SpotCategory.spot_id == SpotDB.id)
            .join(Category, Category.id == SpotCategory.category_id)
            .filter(Category.name == collection["name"])
            .distinct()
        )
    ids = sorted(sid for (sid,) in query.all())
    rng.shuffle(ids)
    return ids[:SECTION_SIZE]


def describe(collection: dict) -> dict:
    name = collection["name"]
    if collection["kind"] == "department":
        return {"label": "Por departamento", "title": f"Lugares en {name}", "href": f"/search?department={name}"}
    return {"label": "Por actividad", "title": CATEGORY_TITLES.get(name, name), "href": f"/search?activity={name}"}


def daily_rng(day: date, key: str = "") -> random.Random:
    # La misma semilla todo el día: la selección no cambia en cada visita.
    return random.Random(f"{day.isoformat()}|{key}")


def pick_collections(db: Session, day: date) -> list[dict]:
    eligible = eligible_collections(db)
    chosen = daily_rng(day, "colecciones").sample(eligible, min(RANDOM_COLLECTIONS, len(eligible)))
    return [
        {**c, **describe(c), "key": f"{c['kind']}:{c['name']}",
         "spot_ids": collection_spot_ids(db, c, daily_rng(day, f"{c['kind']}:{c['name']}"))}
        for c in chosen
    ]


def stats(db: Session) -> dict:
    total = visible(db.query(func.count(SpotDB.id))).scalar() or 0
    departments = visible(db.query(func.count(distinct(SpotDB.department)))).scalar() or 0
    return {"spots": total, "departments": departments}
