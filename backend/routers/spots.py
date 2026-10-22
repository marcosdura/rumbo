"""Lecturas públicas de lugares: búsqueda, mapa, cercanos y la página de un
lugar. Lo del dueño está en spot_owner.py y lo del admin en spot_admin.py."""
import math
from fastapi import APIRouter, Depends, HTTPException, Request, Query, Response
from sqlalchemy.orm import Session
from database import get_db
from limiter import limiter
from models import SpotDB, SpotAmenity, ClimbingSector, SpotCategory, Experience
from schemas import SpotResponse
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from sqlalchemy import case, func
from typing import Optional, List
from routers.sectors import _attach_sector_stats
from spot_payloads import SPOT_DETAIL_OPTIONS, SPOT_LIST_OPTIONS, serialize_spot_list, spot_detail
from text_search import words
from spot_search import NEARBY_RADIUS_KM, build_spots_filter_query, distance_km


router = APIRouter()


@router.get("/")
def home():
    return {"message": "Spots API running"}


@router.get("/spots/ids")
def get_spot_ids(db: Session = Depends(get_db)):
    rows = db.query(SpotDB.id, SpotDB.slug).filter(SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None), SpotDB.slug != None).all()
    return [{"id": r.id, "slug": r.slug} for r in rows]


@router.get("/spots/check-name")
@limiter.limit("20/minute")
async def check_spot_name(request: Request, name: str, db: Session = Depends(get_db)):
    existing = db.query(SpotDB).filter(func.lower(SpotDB.name) == func.lower(name)).first()
    return {"exists": existing is not None}


SUGGEST_LIMIT = 5


@router.get("/spots/suggest")
@limiter.limit("60/minute")
def suggest_spots(request: Request, q: str = Query(min_length=2, max_length=80), db: Session = Depends(get_db)):
    """Lugares cuyo nombre coincide con lo que se va escribiendo en el campo
    "Dónde" del buscador (hasta 5). Primero los que empiezan así; sin
    importar tildes ni mayúsculas. Va antes que /spots/{id}: si no,
    "suggest" se tomaría como un id."""
    terms = words(q)
    if not terms:
        return []
    query = (
        db.query(SpotDB)
        .options(joinedload(SpotDB.category))
        .filter(SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None), SpotDB.slug != None)
    )
    for word in terms:
        query = query.filter(SpotDB.name_search.contains(word, autoescape=True))
    starts = case((SpotDB.name_search.startswith(" ".join(terms), autoescape=True), 0), else_=1)
    spots = query.order_by(starts, func.lower(SpotDB.name), SpotDB.id).limit(SUGGEST_LIMIT).all()
    return [
        {"id": s.id, "name": s.name, "slug": s.slug, "department": s.department,
         "category": s.category.name if s.category else None}
        for s in spots
    ]


@router.get("/spots/nearby")
@limiter.limit("30/minute")
def nearby_spots(request: Request, lat: float, lng: float, db: Session = Depends(get_db)):
    """Lugares publicados a menos de 1 km de un punto: agregar-lugar avisa
    "¿Es alguno de estos?" al marcar la ubicación, para no cargar uno que ya
    existe con otro nombre. Primero se acota con un recuadro (barato) y
    después se mide la distancia real."""
    dlat = NEARBY_RADIUS_KM / 111.0
    dlng = NEARBY_RADIUS_KM / (111.0 * max(math.cos(math.radians(lat)), 0.01))
    candidates = (
        db.query(SpotDB)
        .options(joinedload(SpotDB.category))
        .filter(
            SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None),
            SpotDB.lat.between(lat - dlat, lat + dlat), SpotDB.lng.between(lng - dlng, lng + dlng),
        )
        .all()
    )
    found = []
    for spot in candidates:
        d = distance_km(lat, lng, spot.lat, spot.lng)
        if d <= NEARBY_RADIUS_KM:
            found.append({
                "id": spot.id, "name": spot.name, "slug": spot.slug,
                "category": spot.category.name if spot.category else None,
                "distance_m": round(d * 1000),
            })
    return sorted(found, key=lambda f: f["distance_m"])


@router.get("/spots", response_model=list[SpotResponse])
def get_spots(
    response: Response,
    db: Session = Depends(get_db),
    activity: Optional[str] = None,
    department: Optional[str] = None,
    # Por nombre (el campo "Dónde" del buscador, con texto libre).
    q: Optional[str] = Query(default=None, max_length=80),
    difficulty: Optional[List[str]] = Query(default=None),
    duration: Optional[List[str]] = Query(default=None),
    distance: Optional[List[str]] = Query(default=None),
    parking: Optional[bool] = None,
    potable_water: Optional[bool] = None,
    pet_friendly: Optional[bool] = None,
    kids_friendly: Optional[bool] = None,
    bathrooms: Optional[bool] = None,
    camping_amenity: Optional[bool] = None,
    water_type: Optional[List[str]] = Query(default=None),
    kayak_difficulty: Optional[List[str]] = Query(default=None),
    kayak_duration: Optional[List[str]] = Query(default=None),
    rental_available: Optional[bool] = None,
    class_type: Optional[List[str]] = Query(default=None),
    surf_duration: Optional[List[str]] = Query(default=None),
    equipment_included: Optional[bool] = None,
    has_surf_school: Optional[bool] = None,
    climbing_type: Optional[List[str]] = Query(default=None),
    grade_range: Optional[List[str]] = Query(default=None),
    no_restrictions: Optional[bool] = None,
    amenity_ids: Optional[List[int]] = Query(default=None),
    price_range: Optional[List[str]] = Query(default=None),
    reservation_required: Optional[bool] = None,
    cell_signal: Optional[bool] = None,
    glamping_price: Optional[List[str]] = Query(default=None),
    glamping_amenity: Optional[List[str]] = Query(default=None),
    motorhome_service: Optional[List[str]] = Query(default=None),
    sort: Optional[str] = Query(default="recent"),  # recent | oldest
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = build_spots_filter_query(
        db, activity=activity, department=department, q=q, difficulty=difficulty,
        duration=duration, distance=distance, parking=parking, potable_water=potable_water,
        pet_friendly=pet_friendly, kids_friendly=kids_friendly, bathrooms=bathrooms,
        camping_amenity=camping_amenity, water_type=water_type, kayak_difficulty=kayak_difficulty,
        kayak_duration=kayak_duration, rental_available=rental_available, class_type=class_type,
        surf_duration=surf_duration, equipment_included=equipment_included, has_surf_school=has_surf_school,
        climbing_type=climbing_type, grade_range=grade_range, no_restrictions=no_restrictions,
        amenity_ids=amenity_ids, price_range=price_range,
        reservation_required=reservation_required, cell_signal=cell_signal,
        glamping_price=glamping_price, glamping_amenity=glamping_amenity,
        motorhome_service=motorhome_service, sort=sort,
    )

    # Total antes de paginar — calculado antes de sumar los joinedload/
    # selectinload de abajo, para que no interfieran con el count().
    # order_by(None) es necesario: build_spots_filter_query ya le aplicó un
    # ORDER BY created_at, y Postgres exige que las columnas del ORDER BY
    # estén en el SELECT cuando hay DISTINCT (SQLite no lo exige, por eso
    # esto pasaba los tests locales pero rompía en producción).
    total = query.order_by(None).with_entities(SpotDB.id).distinct().count()
    response.headers["X-Total-Count"] = str(total)

    query = query.options(*SPOT_LIST_OPTIONS)
    spots = query.limit(limit).offset(offset).all()
    return serialize_spot_list(db, spots)


@router.get("/spots/pins")
def get_spot_pins(
    db: Session = Depends(get_db),
    activity: Optional[str] = None,
    department: Optional[str] = None,
    # Por nombre (el campo "Dónde" del buscador, con texto libre).
    q: Optional[str] = Query(default=None, max_length=80),
    difficulty: Optional[List[str]] = Query(default=None),
    duration: Optional[List[str]] = Query(default=None),
    distance: Optional[List[str]] = Query(default=None),
    parking: Optional[bool] = None,
    potable_water: Optional[bool] = None,
    pet_friendly: Optional[bool] = None,
    kids_friendly: Optional[bool] = None,
    bathrooms: Optional[bool] = None,
    camping_amenity: Optional[bool] = None,
    water_type: Optional[List[str]] = Query(default=None),
    kayak_difficulty: Optional[List[str]] = Query(default=None),
    kayak_duration: Optional[List[str]] = Query(default=None),
    rental_available: Optional[bool] = None,
    class_type: Optional[List[str]] = Query(default=None),
    surf_duration: Optional[List[str]] = Query(default=None),
    equipment_included: Optional[bool] = None,
    has_surf_school: Optional[bool] = None,
    climbing_type: Optional[List[str]] = Query(default=None),
    grade_range: Optional[List[str]] = Query(default=None),
    no_restrictions: Optional[bool] = None,
    amenity_ids: Optional[List[int]] = Query(default=None),
    price_range: Optional[List[str]] = Query(default=None),
    reservation_required: Optional[bool] = None,
    cell_signal: Optional[bool] = None,
    glamping_price: Optional[List[str]] = Query(default=None),
    glamping_amenity: Optional[List[str]] = Query(default=None),
    motorhome_service: Optional[List[str]] = Query(default=None),
    sort: Optional[str] = Query(default="recent"),
):
    """Para el mapa de /search: los mismos filtros que GET /spots, pero sin
    paginar (el mapa necesita todos los pines que matcheen) y con el payload
    mínimo que usa SpotsMap.jsx — nada de imágenes/amenities/rutas/reviews,
    que es lo que hace pesado a GET /spots."""
    query = build_spots_filter_query(
        db, activity=activity, department=department, q=q, difficulty=difficulty,
        duration=duration, distance=distance, parking=parking, potable_water=potable_water,
        pet_friendly=pet_friendly, kids_friendly=kids_friendly, bathrooms=bathrooms,
        camping_amenity=camping_amenity, water_type=water_type, kayak_difficulty=kayak_difficulty,
        kayak_duration=kayak_duration, rental_available=rental_available, class_type=class_type,
        surf_duration=surf_duration, equipment_included=equipment_included, has_surf_school=has_surf_school,
        climbing_type=climbing_type, grade_range=grade_range, no_restrictions=no_restrictions,
        amenity_ids=amenity_ids, price_range=price_range,
        reservation_required=reservation_required, cell_signal=cell_signal,
        glamping_price=glamping_price, glamping_amenity=glamping_amenity,
        motorhome_service=motorhome_service, sort=sort,
    )
    query = query.options(
        joinedload(SpotDB.category),
        selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category),
    )
    spots = query.all()

    result = []
    for spot in spots:
        sorted_spot_categories = sorted(spot.spot_categories, key=lambda sc: not sc.is_primary)
        categories = [sc.category for sc in sorted_spot_categories]
        result.append({
            "id": spot.id,
            "name": spot.name,
            "slug": spot.slug,
            "department": spot.department,
            "lat": spot.lat,
            "lng": spot.lng,
            "category": spot.category,
            "categories": categories,
        })
    return result


@router.get("/spots/by-slug/{slug}", response_model=SpotResponse)
def get_spot_by_slug(slug: str, db: Session = Depends(get_db)):
    spot = (
        db.query(SpotDB)
        .options(*SPOT_DETAIL_OPTIONS)
        .filter(SpotDB.slug == slug, SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot_detail(db, spot)


@router.get("/spots/{id}", response_model=SpotResponse)
def get_spot(id: int, db: Session = Depends(get_db)):
    spot = (
        db.query(SpotDB)
        .options(
            selectinload(SpotDB.category),
            selectinload(SpotDB.routes),
            selectinload(SpotDB.amenities).selectinload(SpotAmenity.amenity),
            selectinload(SpotDB.images),
            selectinload(SpotDB.trekking_detail),
            selectinload(SpotDB.camping_detail),
            selectinload(SpotDB.glamping_detail),
            selectinload(SpotDB.glamping_amenities),
            selectinload(SpotDB.motorhome_detail),
            selectinload(SpotDB.surf_detail),
            selectinload(SpotDB.kayak_service_detail),
            selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category),
            selectinload(SpotDB.experiences).selectinload(Experience.category),
            selectinload(SpotDB.climbing_sectors).selectinload(ClimbingSector.routes),
        )
        .filter(SpotDB.id == id)
        .first()
    )

    if not spot or not spot.is_approved or spot.owner_deleted_at is not None:
        raise HTTPException(status_code=404, detail="Spot not found")

    return {
        "id": spot.id,
        "name": spot.name,
        "description": spot.description,
        "department": spot.department,
        "lat": spot.lat,
        "lng": spot.lng,
        "email": spot.email,
        "instagram": spot.instagram,
        "whatsapp": spot.whatsapp,
        "price": spot.price,
        "created_at": spot.created_at,
        "category": spot.category,
        "categories": [sc.category for sc in spot.spot_categories],
        "camping_detail": spot.camping_detail,
        "glamping_detail": spot.glamping_detail,
        "glamping_amenities": spot.glamping_amenities,
        "motorhome_detail": spot.motorhome_detail,
        "surf_detail": spot.surf_detail,
        "kayak_service_detail": spot.kayak_service_detail,
        "trekking_detail": spot.trekking_detail,
        "amenities": [
            sa.amenity for sa in spot.amenities if sa.amenity is not None
        ],
        "routes": spot.routes,
        "images": sorted(spot.images, key=lambda img: (0 if img.is_main else 1, img.order, img.id)),
        "experiences": spot.experiences,
        "climbing_sectors": [_attach_sector_stats(sec) for sec in spot.climbing_sectors],
        "season_start": spot.season_start,
        "season_end": spot.season_end,
        "is_public": spot.is_public,
        "public_transport": spot.public_transport,
        # Lo sugirió un visitante: la página avisa que está a confirmar y
        # ofrece reclamarlo (claims.py).
        "suggested_by_visitor": bool(spot.suggested_by_visitor),
        "pets_allowed": spot.pets_allowed,
        "reservation_required": spot.reservation_required,
        "cell_signal": spot.cell_signal,
    }


