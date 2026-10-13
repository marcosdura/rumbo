"""El resumen del panel de admin (GET /admin/summary): lo que hay para
revisar, cómo viene el sitio y qué contenido falta completar.

- Bandeja: cuántos hay en cada cola y desde cuándo espera el más viejo.
- Métricas: últimos 30 días contra los 30 anteriores (usuarios nuevos,
  reseñas, favoritos, visitas, lugares nuevos), y visitas por día.
- Los más vistos (30 días) y los más guardados.
- Salud del contenido: lugares publicados sin fotos, sin descripción o sin
  reseñas (con algunos de ejemplo para ir a completarlos).

Todo sale de datos que ya se guardan: no hay tablas nuevas.
"""
from datetime import date, datetime, time, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from models import (
    Contribution, Favorite, Report, Review, SpotChangeRequest,
    SpotClaim, SpotDB, SpotImage, SpotView, User,
)

DAYS = 30
TOP = 5
# Ejemplos por problema de contenido (el total va aparte).
SAMPLE = 8


def _iso(value):
    return value.isoformat() if value else None


def _queue(query, created_at):
    count, oldest = query.with_entities(func.count(), func.min(created_at)).one()
    return {"count": count, "oldest": _iso(oldest)}


def queues(db: Session) -> dict:
    new_spots = db.query(SpotDB).filter(
        SpotDB.is_approved.is_(False), SpotDB.rejected_at.is_(None), SpotDB.owner_deleted_at.is_(None),
    )
    open_reports = db.query(Report).filter(Report.status == "open")
    # Los reportes se revisan agrupados por cosa reportada (como en la pestaña).
    report_groups = len({tuple(r) for r in open_reports.with_entities(Report.target_kind, Report.target_id)})
    return {
        "new_spots": _queue(new_spots, SpotDB.created_at),
        "changes": _queue(db.query(SpotChangeRequest).filter(SpotChangeRequest.status == "pending"), SpotChangeRequest.created_at),
        "contributions": _queue(db.query(Contribution).filter(Contribution.status == "pending"), Contribution.created_at),
        "reports": {**_queue(open_reports, Report.created_at), "count": report_groups},
        "claims": _queue(db.query(SpotClaim).filter(SpotClaim.status == "pending"), SpotClaim.created_at),
    }


def _windows(today: date):
    """(desde, hasta) de los últimos 30 días y de los 30 anteriores, en días."""
    current = (today - timedelta(days=DAYS - 1), today)
    previous = (today - timedelta(days=2 * DAYS - 1), today - timedelta(days=DAYS))
    return current, previous


def _between_days(column, window):
    start, end = window
    return column.between(datetime.combine(start, time.min), datetime.combine(end, time.max))


def _published(db: Session):
    return db.query(SpotDB).filter(SpotDB.is_approved.is_(True), SpotDB.owner_deleted_at.is_(None))


def metrics(db: Session, today: date) -> dict:
    current, previous = _windows(today)

    def counts(fn):
        return {"current": fn(current), "previous": fn(previous)}

    def created(model):
        return lambda w: db.query(model).filter(_between_days(model.created_at, w)).count()

    return {
        "users": counts(created(User)),
        "reviews": counts(created(Review)),
        "favorites": counts(created(Favorite)),
        "views": counts(lambda w: db.query(SpotView).filter(SpotView.day.between(*w)).count()),
        "new_spots": counts(lambda w: _published(db).filter(_between_days(SpotDB.created_at, w)).count()),
    }


def views_by_day(db: Session, today: date) -> list[dict]:
    start = today - timedelta(days=DAYS - 1)
    rows = dict(
        db.query(SpotView.day, func.count()).filter(SpotView.day >= start).group_by(SpotView.day).all()
    )
    return [
        {"day": (start + timedelta(days=i)).isoformat(), "count": rows.get(start + timedelta(days=i), 0)}
        for i in range(DAYS)
    ]


def _top(db: Session, model, count_col, *filters) -> list[dict]:
    rows = (
        db.query(SpotDB.id, SpotDB.name, SpotDB.slug, func.count(count_col).label("n"))
        .join(model, model.spot_id == SpotDB.id)
        .filter(SpotDB.is_approved.is_(True), SpotDB.owner_deleted_at.is_(None), *filters)
        .group_by(SpotDB.id, SpotDB.name, SpotDB.slug)
        .order_by(func.count(count_col).desc(), SpotDB.name)
        .limit(TOP)
        .all()
    )
    return [{"id": r.id, "name": r.name, "slug": r.slug, "count": r.n} for r in rows]


def _missing(query) -> dict:
    spots = query.order_by(SpotDB.name).all()
    return {
        "count": len(spots),
        "spots": [{"id": s.id, "name": s.name, "slug": s.slug} for s in spots[:SAMPLE]],
    }


def content_health(db: Session) -> dict:
    with_photos = db.query(SpotImage.spot_id)
    with_reviews = db.query(Review.spot_id)
    return {
        "no_photos": _missing(_published(db).filter(SpotDB.id.notin_(with_photos))),
        "no_description": _missing(_published(db).filter(or_(SpotDB.description.is_(None), func.trim(SpotDB.description) == ""))),
        "no_reviews": _missing(_published(db).filter(SpotDB.id.notin_(with_reviews))),
    }


def summary(db: Session, today: date | None = None) -> dict:
    today = today or date.today()
    return {
        "queues": queues(db),
        "metrics": metrics(db, today),
        "views_by_day": views_by_day(db, today),
        "top_viewed": _top(db, SpotView, SpotView.id, SpotView.day >= today - timedelta(days=DAYS - 1)),
        "top_favorited": _top(db, Favorite, Favorite.id),
        "content_health": content_health(db),
    }
