from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

import home
import views
from auth import get_current_user
from database import get_db
from limiter import get_client_ip, limiter
from models import SpotDB
from routers.spots import SPOT_LIST_OPTIONS, serialize_spot_list

router = APIRouter(tags=["home"])


def _spots_by_ids(db: Session, ids: list[int]) -> list[dict]:
    """Los lugares en el orden de ids, como los muestra SpotCard."""
    if not ids:
        return []
    spots = db.query(SpotDB).options(*SPOT_LIST_OPTIONS).filter(SpotDB.id.in_(ids)).all()
    by_id = {s.id: s for s in spots}
    return serialize_spot_list(db, [by_id[i] for i in ids if i in by_id])


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
            "spots": _spots_by_ids(db, home.popular_ids(db, home.daily_rng(today, "populares"))),
        },
        {
            "key": "recent", "label": "Novedades", "title": "Recién agregados",
            "href": "/search", "total": stats["spots"],
            "spots": _spots_by_ids(db, home.recent_ids(db)),
        },
    ]
    for c in home.pick_collections(db, today):
        sections.append({
            "key": c["key"], "label": c["label"], "title": c["title"], "href": c["href"],
            "total": c["total"], "spots": _spots_by_ids(db, c["spot_ids"]),
        })
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
