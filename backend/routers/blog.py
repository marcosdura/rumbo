"""El blog, de lectura pública (blog.py). Solo las notas publicadas: un
borrador da 404 como si no existiera."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import blog
from database import get_db
from models import BlogPost, SpotDB
from spot_payloads import SPOT_LIST_OPTIONS, serialize_spot_list

router = APIRouter(prefix="/blog", tags=["blog"])


def _published(db: Session):
    return db.query(BlogPost).filter(BlogPost.status == "published", BlogPost.published_at.isnot(None))


@router.get("/posts")
def list_posts(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Las notas publicadas, de la más nueva a la más vieja (sin los bloques)."""
    query = _published(db)
    if category:
        if category not in blog.CATEGORIES:
            raise HTTPException(status_code=422, detail="Categoría inválida")
        query = query.filter(BlogPost.category == category)
    return [blog.summary(p) for p in query.order_by(BlogPost.published_at.desc(), BlogPost.id.desc()).all()]


@router.get("/posts/{slug}")
def get_post(slug: str, db: Session = Depends(get_db)):
    """Una nota con lo necesario para mostrarla: los lugares de Rumbo que
    nombra vienen como los muestra SpotCard. Un lugar que ya no está
    publicado se saca del mapa (la nota no se rompe)."""
    post = _published(db).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    ids = blog.spot_ids(post)
    spots = (
        db.query(SpotDB).options(*SPOT_LIST_OPTIONS)
        .filter(SpotDB.id.in_(ids), SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))  # noqa: E712
        .all()
    ) if ids else []
    by_id = {s["id"]: s for s in serialize_spot_list(db, spots)}

    map_ = post.map
    if map_:
        points = [p for p in map_["points"] if not p.get("spot_id") or p["spot_id"] in by_id]
        map_ = {**map_, "points": points} if points or map_["tracks"] else None
    point_ids = {p["id"] for p in (map_ or {}).get("points", [])}
    blocks = [
        b for b in post.blocks
        if not (b["type"] == "point" and b["point"] not in point_ids)
        and not (b["type"] == "spot" and b["spot_id"] not in by_id)
    ]

    related = (
        _published(db).filter(BlogPost.id != post.id, BlogPost.category == post.category)
        .order_by(BlogPost.published_at.desc()).limit(3).all()
    )
    return {
        **blog.summary(post),
        "map": map_,
        "blocks": blocks,
        "spots": {str(k): v for k, v in by_id.items()},
        "related": [blog.summary(p) for p in related],
    }
