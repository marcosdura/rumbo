import math
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

import home
import views
from auth import get_current_user
from database import get_db
from limiter import get_client_ip, limiter
from sqlalchemy import func

from models import Category, ClimbingSector, KayakServiceDetail, Route, SpotCategory, SpotDB, SurfDetail
from ownership import get_owned_spot_or_admin
from routers.spots import SPOT_LIST_OPTIONS, distance_km, serialize_spot_list

router = APIRouter(tags=["home"])


def _spots_by_id_lists(db: Session, id_lists: list[list[int]]) -> list[list[dict]]:
    """Los lugares de cada lista, en su orden, como los muestra SpotCard.
    Todas las secciones en una sola carga: antes cada una repetía las mismas
    consultas (lugares, fotos, detalles, reseñas)."""
    ids = list(dict.fromkeys(i for lst in id_lists for i in lst))
    if not ids:
        return [[] for _ in id_lists]
    spots = db.query(SpotDB).options(*SPOT_LIST_OPTIONS).filter(SpotDB.id.in_(ids)).all()
    by_id = {item["id"]: item for item in serialize_spot_list(db, spots)}
    return [[by_id[i] for i in lst if i in by_id] for lst in id_lists]


@router.get("/home")
def get_home(db: Session = Depends(get_db)):
    """Todo lo de la página principal en un pedido: populares (siempre
    arriba), recién agregados y las colecciones del día (home.py)."""
    today = date.today()
    stats = home.stats(db)
    sections = [
        {
            "key": "popular", "label": "Lo que más gusta", "title": "Populares",
            "href": "/search", "total": 0,
            "ids": home.popular_ids(db, home.daily_rng(today, "populares")),
        },
        {
            "key": "recent", "label": "Novedades", "title": "Recién agregados",
            "href": "/search", "total": stats["spots"],
            "ids": home.recent_ids(db),
        },
    ]
    for c in home.pick_collections(db, today):
        sections.append({
            "key": c["key"], "label": c["label"], "title": c["title"], "href": c["href"],
            "total": c["total"], "ids": c["spot_ids"],
        })
    for section, spots in zip(sections, _spots_by_id_lists(db, [s.pop("ids") for s in sections])):
        section["spots"] = spots
    return {"stats": stats, "sections": [s for s in sections if s["spots"]]}


@router.post("/spots/{spot_id}/view", status_code=204)
@limiter.limit("60/minute")
def record_spot_view(request: Request, spot_id: int, db: Session = Depends(get_db), user: dict | None = Depends(get_current_user)):
    """Una visita a la página del lugar (views.py). Sin sesión, la persona se
    identifica por IP + navegador, solo para no contarla dos veces el mismo
    día (se guarda un hash, nunca la IP)."""
    if views.is_bot(request.headers.get("user-agent")):
        return Response(status_code=204)
    spot = db.get(SpotDB, spot_id)
    if not spot or not spot.is_approved:
        raise HTTPException(status_code=404, detail="Spot not found")
    identity = (user or {}).get("email") or f"{get_client_ip(request)}|{request.headers.get('user-agent', '')}"
    views.record_view(db, spot_id, identity)
    return Response(status_code=204)


NEARBY_SPOTS_KM = 25.0
NEARBY_SPOTS_LIMIT = 4


@router.get("/spots/{spot_id}/nearby")
def spots_near_spot(spot_id: int, services: Optional[str] = None, db: Session = Depends(get_db)):
    """"Cerca de acá" en la página del lugar: hasta 4 lugares publicados a
    menos de 25 km, del más cercano al más lejano, con la distancia. Para
    armar la salida (camping + trekking cerca, por ejemplo).
    services=surf|kayak: solo escuelas de surf o servicios de kayak (las
    "escuelas cerca" en la página de una playa)."""
    spot = db.get(SpotDB, spot_id)
    if not spot or not spot.is_approved:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.lat is None or spot.lng is None:
        return []
    # Primero un recuadro (barato), después la distancia real.
    dlat = NEARBY_SPOTS_KM / 111.0
    dlng = NEARBY_SPOTS_KM / (111.0 * max(math.cos(math.radians(spot.lat)), 0.01))
    candidates = (
        home.visible(db.query(SpotDB).options(*SPOT_LIST_OPTIONS))
        .filter(
            SpotDB.id != spot.id,
            SpotDB.lat.between(spot.lat - dlat, spot.lat + dlat),
            SpotDB.lng.between(spot.lng - dlng, spot.lng + dlng),
        )
    )
    service_model = {"surf": SurfDetail, "kayak": KayakServiceDetail}.get(services or "")
    if services and service_model is None:
        raise HTTPException(status_code=422, detail="services: surf o kayak")
    if service_model is not None:
        candidates = candidates.join(service_model, service_model.spot_id == SpotDB.id)
    candidates = candidates.all()
    near = sorted(
        ((distance_km(spot.lat, spot.lng, c.lat, c.lng), c) for c in candidates),
        key=lambda pair: pair[0],
    )
    near = [(d, c) for d, c in near if d <= NEARBY_SPOTS_KM][:NEARBY_SPOTS_LIMIT]
    items = serialize_spot_list(db, [c for _, c in near])
    for item, (d, _) in zip(items, near):
        item["distance_km"] = round(d, 1)
    return items


@router.get("/spots/{spot_id}/owner-stats")
def spot_owner_stats(spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Visitas de los últimos 30 días y favoritos, para el panel del dueño."""
    return views.owner_stats(db, spot.id)


@router.get("/sitemap/trails")
def sitemap_trails(db: Session = Depends(get_db)):
    """Rutas de trekking y sectores de escalada publicados, para el sitemap
    (antes no estaban: Google no encontraba esas páginas). Solo de lugares
    publicados y con slug; los aportes en revisión los oculta el filtro global."""
    def rows(model, kind):
        return [
            {"kind": kind, "spot_slug": spot_slug, "slug": slug}
            for slug, spot_slug in (
                db.query(model.slug, SpotDB.slug)
                .join(SpotDB, SpotDB.id == model.spot_id)
                .filter(
                    model.slug.isnot(None), SpotDB.slug.isnot(None),
                    SpotDB.is_approved.is_(True), SpotDB.owner_deleted_at.is_(None),
                )
                .order_by(SpotDB.slug, model.slug)
            )
        ]
    return rows(Route, "rutas") + rows(ClimbingSector, "sectores")


@router.get("/sitemap/places")
def sitemap_places(db: Session = Depends(get_db)):
    """Cuántos lugares publicados hay por actividad y departamento, para las
    páginas /lugares/... (sus links y el sitemap): así no se arma ninguna
    página vacía. La actividad es la misma que filtra GET /spots?activity=
    (cualquier categoría del lugar, no solo la principal)."""
    rows = (
        db.query(Category.name, SpotDB.department, func.count(SpotDB.id))
        .join(SpotCategory, SpotCategory.category_id == Category.id)
        .join(SpotDB, SpotDB.id == SpotCategory.spot_id)
        .filter(SpotDB.is_approved.is_(True), SpotDB.owner_deleted_at.is_(None), SpotDB.slug.isnot(None))
        .group_by(Category.name, SpotDB.department)
        .order_by(Category.name, SpotDB.department)
        .all()
    )
    return [{"activity": a, "department": d, "count": n} for a, d, n in rows if d]


@router.get("/spots/legacy/{kind}/{legacy_id}")
def legacy_operator(kind: str, legacy_id: int, db: Session = Depends(get_db)):
    """Las direcciones viejas de escuelas y kayaks (/surf/<nombre>-<id>,
    /kayak/<nombre>-<id>): a qué lugar redirigir, ahora que son lugares."""
    model = {"surf": SurfDetail, "kayak": KayakServiceDetail}.get(kind)
    if model is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    spot = (
        db.query(SpotDB).join(model, model.spot_id == SpotDB.id)
        .filter(model.legacy_id == legacy_id, SpotDB.is_approved.is_(True), SpotDB.owner_deleted_at.is_(None))
        .first()
    )
    if not spot or not spot.slug:
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"slug": spot.slug}
