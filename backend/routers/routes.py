from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import Route, SpotDB
import home
from schemas import RouteCreate, RouteResponse
from database import get_db
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter
from slugs import generate_slug
import contributions
import item_photos
import route_tracks
from pydantic import BaseModel

router = APIRouter(prefix="/routes", tags=["routes"])

@router.post("/", response_model=RouteResponse)
@limiter.limit("10/minute")
async def create_route(request: Request, route: RouteCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    spot = assert_owns_spot(db, route.spot_id, user)
    pending = contributions.decide(spot, "trekking_route", user)
    db_route = Route(**route.dict())
    db_route.slug = generate_slug(route.name)
    db.add(db_route)
    db.flush()
    contributions.register(db, "trekking_route", db_route, spot, user, pending)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/{route_id}")
@limiter.limit("20/minute")
def delete_route(request: Request, route_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    # include_pending: el dueño también borra una ruta en revisión.
    route = db.query(Route).execution_options(include_pending=True).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    assert_owns_spot(db, route.spot_id, user)
    photos = contributions.delete_item(db, "trekking_route", route, by=user.get("email"))
    db.commit()
    # Sus fotos (de la ruta, sector o vía): después del commit.
    contributions.destroy_cloudinary_images(photos)
    return {"ok": True}


@router.get("/", response_model=list[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    return db.query(Route).all()

@router.get("/by-slug/{slug}", response_model=RouteResponse)
def get_route_by_slug(slug: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.slug == slug).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

def spot_main_image(spot: SpotDB):
    """La foto principal del lugar (para compartir una ruta o sector sin fotos)."""
    images = sorted(spot.images, key=lambda img: (0 if img.is_main else 1, img.order, img.id))
    return images[0].cloudinary_public_id if images else None


def visible_spot_by_slug(db: Session, slug: str) -> SpotDB:
    """El lugar publicado de una página de ruta o sector (404 si no)."""
    spot = home.visible(db.query(SpotDB)).filter(SpotDB.slug == slug).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


TREKKING_FEATURES = ["bathrooms", "potable_water", "kids_friendly", "camping", "parking", "fire_pits", "shelter", "accessible"]


@router.get("/page/{spot_slug}/{route_slug}")
def get_route_page(spot_slug: str, route_slug: str, db: Session = Depends(get_db)):
    """Todo lo de la página de una ruta de trekking, buscada dentro de su
    lugar: el slug de una ruta no es único entre lugares ("Sendero al
    mirador" puede haber en varios), y /by-slug devolvía la primera."""
    spot = visible_spot_by_slug(db, spot_slug)
    route = db.query(Route).filter(Route.spot_id == spot.id, Route.slug == route_slug).order_by(Route.id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    detail = spot.trekking_detail
    track, track_pending = route_tracks.public_track(db, route.id)
    # "Otras rutas en este lugar": antes había que volver al lugar.
    others = db.query(Route).filter(Route.spot_id == spot.id, Route.id != route.id).order_by(Route.id).all()
    return {
        "route": {
            **RouteResponse.model_validate(route).model_dump(mode="json"),
            "photos": item_photos.photos_of(db, "trekking_route", [route.id])[route.id],
            "photo_slots": item_photos.slots_of(db, "trekking_route", [route.id])[route.id],
            "track": track,
            # Hay uno en revisión: no se ofrece subir otro.
            "track_pending": track_pending,
        },
        "spot": {
            "id": spot.id, "name": spot.name, "slug": spot.slug, "department": spot.department,
            "trekking_detail": {f: getattr(detail, f) for f in TREKKING_FEATURES} if detail else None,
            "image": spot_main_image(spot),
        },
        "others": [
            {"name": o.name, "slug": o.slug, "distance_km": o.distance_km, "difficulty": o.difficulty}
            for o in others if o.slug
        ],
    }


class TrackCreate(BaseModel):
    # [[lat, lng, altura o null], ...], leído del GPX en el navegador.
    points: list[list]


@router.post("/{route_id}/track")
@limiter.limit("10/minute")
def add_route_track(request: Request, route_id: int, body: TrackCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """El recorrido de la ruta (route_tracks.py). Pasa por revisión, salvo el admin."""
    track = route_tracks.add_track(db, route_id, body.points, user)
    db.commit()
    return {"pending": not track.is_approved, "distance_km": track.distance_km}


@router.delete("/{route_id}/track")
@limiter.limit("20/minute")
def remove_route_track(request: Request, route_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """El dueño del lugar o el admin saca el recorrido (route_tracks.owner_remove)."""
    route_tracks.owner_remove(db, route_id, user)
    db.commit()
    return {"ok": True}


@router.get("/{route_id}", response_model=RouteResponse)
def get_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    # Antes devolvía None, que con response_model terminaba en un 500.
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
