"""El blog (blog.py). La lectura pública, solo las notas publicadas (un
borrador da 404 como si no existiera), y el editor del admin en
/admin/blog."""
from types import SimpleNamespace
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import blog
from auth import get_current_admin_user, get_current_user_required
from database import get_db
from limiter import limiter
from models import BlogPost, BlogSave, SpotDB
from spot_payloads import SPOT_LIST_OPTIONS, serialize_spot_list

router = APIRouter(prefix="/blog", tags=["blog"])


def _published(db: Session):
    return db.query(BlogPost).filter(BlogPost.status == "published", BlogPost.published_at.isnot(None))


@router.get("/posts")
def list_posts(category: Optional[str] = None, spot: Optional[int] = None, db: Session = Depends(get_db)):
    """Las notas publicadas, de la más nueva a la más vieja (sin los bloques).
    `spot`: solo las que nombran ese lugar (en el mapa o en una tarjeta):
    "Aparece en estas guías" en la página del lugar."""
    query = _published(db)
    if category:
        if category not in blog.CATEGORIES:
            raise HTTPException(status_code=422, detail="Categoría inválida")
        query = query.filter(BlogPost.category == category)
    posts = query.order_by(BlogPost.published_at.desc(), BlogPost.id.desc()).all()
    # Los lugares van dentro del JSON de la nota: se filtra acá (son pocas
    # notas y no hace falta una tabla aparte).
    if spot is not None:
        posts = [p for p in posts if spot in blog.spot_ids(p)]
    return [blog.summary(p) for p in posts]


def _spots_by_id(db: Session, ids: list[int]) -> dict[int, dict]:
    """Los lugares publicados, como los muestra SpotCard."""
    if not ids:
        return {}
    spots = (
        db.query(SpotDB).options(*SPOT_LIST_OPTIONS)
        .filter(SpotDB.id.in_(ids), SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))  # noqa: E712
        .all()
    )
    return {s["id"]: s for s in serialize_spot_list(db, spots)}


def render(db: Session, post) -> dict:
    """La nota como se muestra (sin las relacionadas). Un lugar que ya no
    está publicado se saca del mapa y de las tarjetas: la nota no se rompe.
    Sirve para una BlogPost y para la vista previa del editor (lo mismo sin
    guardar)."""
    by_id = _spots_by_id(db, blog.spot_ids(post))
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
    return {
        **blog.summary(post),
        "map": map_,
        "blocks": blocks,
        "spots": {str(k): v for k, v in by_id.items()},
    }


@router.get("/posts/{slug}")
def get_post(slug: str, db: Session = Depends(get_db)):
    """Una nota con lo necesario para mostrarla: los lugares de Rumbo que
    nombra vienen como los muestra SpotCard."""
    post = _published(db).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    related = (
        _published(db).filter(BlogPost.id != post.id, BlogPost.category == post.category)
        .order_by(BlogPost.published_at.desc()).limit(3).all()
    )
    return {**render(db, post), "related": [blog.summary(p) for p in related]}


# ─── Guías guardadas ("Guardar esta guía") ──────────────────────────────────
# Aparte de los favoritos de lugares: cada uno ve las suyas en /favorites.

@router.get("/saved")
def saved_posts(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Las guías que guardé y siguen publicadas, la última guardada primero."""
    rows = (
        _published(db).join(BlogSave, BlogSave.post_id == BlogPost.id)
        .filter(BlogSave.user_id == user["sub"])
        .order_by(BlogSave.created_at.desc(), BlogSave.id.desc())
        .all()
    )
    return [blog.summary(p) for p in rows]


def _published_by_slug(db: Session, slug: str) -> BlogPost:
    post = _published(db).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return post


@router.post("/posts/{slug}/save")
@limiter.limit("30/minute")
def save_post(request: Request, slug: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """Guardar una guía. Si ya estaba, no es un error."""
    post = _published_by_slug(db, slug)
    exists = db.query(BlogSave).filter(BlogSave.user_id == user["sub"], BlogSave.post_id == post.id).first()
    if not exists:
        db.add(BlogSave(user_id=user["sub"], post_id=post.id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()  # otro pedido igual al mismo tiempo: ya quedó guardada
    return {"saved": True}


@router.delete("/posts/{slug}/save")
@limiter.limit("30/minute")
def unsave_post(request: Request, slug: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if post:
        db.query(BlogSave).filter(BlogSave.user_id == user["sub"], BlogSave.post_id == post.id).delete()
        db.commit()
    return {"saved": False}


# ─── El editor (admin) ──────────────────────────────────────────────────────

admin_router = APIRouter(prefix="/admin/blog", tags=["blog"], dependencies=[Depends(get_current_admin_user)])


def _editable(db: Session, post: BlogPost) -> dict:
    """La nota tal cual se guardó, para editarla. Con los nombres de los
    lugares de Rumbo que nombra (también los que ya no están publicados: el
    editor avisa)."""
    ids = blog.spot_ids(post)
    spots = db.query(SpotDB).filter(SpotDB.id.in_(ids)).all() if ids else []
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "summary": post.summary,
        "cover_image": post.cover_image,
        "category": post.category,
        "region": post.region,
        "status": post.status,
        "featured": post.featured,
        "map": post.map,
        "blocks": post.blocks,
        "published_at": post.published_at,
        "updated_at": post.updated_at,
        "spots": {str(s.id): _spot_label(s) for s in spots},
    }


def _spot_label(spot: SpotDB) -> dict:
    return {
        "id": spot.id, "name": spot.name, "slug": spot.slug, "department": spot.department,
        "lat": spot.lat, "lng": spot.lng,
        "available": bool(spot.is_approved and spot.owner_deleted_at is None and spot.slug),
    }


def _get(db: Session, post_id: int) -> BlogPost:
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return post


def _check_slug(db: Session, slug: str, post_id: int | None = None):
    taken = db.query(BlogPost).filter(BlogPost.slug == slug)
    if post_id is not None:
        taken = taken.filter(BlogPost.id != post_id)
    if taken.first():
        raise HTTPException(status_code=409, detail=f"Ya hay otra nota con el link /blog/{slug}")


@admin_router.get("/posts")
def admin_list(db: Session = Depends(get_db)):
    """Todas las notas, borradores incluidos: la última tocada primero."""
    posts = db.query(BlogPost).order_by(func.coalesce(BlogPost.updated_at, BlogPost.created_at).desc(), BlogPost.id.desc()).all()
    return [{**blog.summary(p), "id": p.id, "status": p.status, "created_at": p.created_at} for p in posts]


@admin_router.get("/posts/{post_id}")
def admin_get(post_id: int, db: Session = Depends(get_db)):
    return _editable(db, _get(db, post_id))


@admin_router.post("/posts", status_code=201)
@limiter.limit("60/minute")
def admin_create(request: Request, raw: dict = Body(...), db: Session = Depends(get_db)):
    data = blog.clean_post(raw)
    _check_slug(db, data["slug"])
    post = BlogPost()
    db.add(post)
    blog.apply(post, data)
    db.commit()
    return _editable(db, post)


@admin_router.put("/posts/{post_id}")
@limiter.limit("60/minute")
def admin_update(request: Request, post_id: int, raw: dict = Body(...), db: Session = Depends(get_db)):
    post = _get(db, post_id)
    data = blog.clean_post(raw)
    _check_slug(db, data["slug"], post.id)
    blog.apply(post, data)
    db.commit()
    return _editable(db, post)


@admin_router.delete("/posts/{post_id}", status_code=204)
@limiter.limit("60/minute")
def admin_delete(request: Request, post_id: int, db: Session = Depends(get_db)):
    post = _get(db, post_id)
    # Quien la había guardado deja de tenerla (en SQLite la FK no borra sola).
    db.query(BlogSave).filter(BlogSave.post_id == post.id).delete()
    db.delete(post)
    db.commit()


@admin_router.post("/preview")
# Se pide sola mientras se escribe (un rato después de cada cambio).
@limiter.limit("120/minute")
def admin_preview(request: Request, raw: dict = Body(...), db: Session = Depends(get_db)):
    """Cómo se va a ver la nota, sin guardarla: la misma validación (un 422
    dice qué falta) y los lugares resueltos. `missing_spots`: los lugares que
    nombra y no se van a ver (no existen o no están publicados)."""
    data = blog.clean_post(raw)
    post = SimpleNamespace(**data, published_at=raw.get("published_at"), updated_at=None)
    shown = render(db, post)
    wanted = blog.spot_ids(post)
    return {**shown, "related": [], "missing_spots": [i for i in wanted if str(i) not in shown["spots"]]}


@admin_router.get("/can-upload", status_code=204)
def admin_can_upload():
    """Para firmar una foto del blog (app/api/upload/blog-signature): solo
    el admin."""
