from fastapi import APIRouter, Depends, HTTPException, Request, Query, Response
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required, is_admin, get_current_admin_user
from ownership import get_owned_spot_or_admin
from limiter import limiter
from models import SpotDB, SpotAmenity, ClimbingSector, ClimbingRoute, CampingDetail, TrekkingDetail, Route, KayakDetail, SurfSchool, GlampingDetail, SpotImage, SpotCategory, MotorhomeDetail, GlampingAmenity, Experience
from schemas import SpotCreate, SpotResponse, ClimbingSectorResponse, CampingDetailCreate, TrekkingDetailCreate, RouteResponse, SurfSchoolResponse, KayakDetailResponse, GlampingDetailResponse, SpotCategoryAddRequest, MotorhomeDetailCreate, ExperienceCreate, ExperienceResponse
import models
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_, and_
from typing import Optional, List
from database import engine
from models import Base
from slugs import generate_slug
import cloudinary
import cloudinary.uploader
import os




Base.metadata.create_all(bind=engine)


router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


@router.get("/")
def home():
    return {"message": "Spots API running"}

# Crear un spot
# usa la sesion para hablar con la DB
@router.post("/spots", response_model=SpotResponse)
@limiter.limit("10/minute")
async def create_spot(request: Request, spot: SpotCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):

    category = db.query(models.Category).filter(models.Category.id == spot.category_id).first()

    if not category:
        raise HTTPException(status_code=400, detail="Category not found")

    db_spot = SpotDB(
        name=spot.name,
        description=spot.description,
        department=spot.department,
        category_id=spot.category_id,
        email=spot.email,
        instagram=spot.instagram,
        whatsapp=spot.whatsapp,
        price=spot.price,
        season_start=spot.season_start,
        season_end=spot.season_end,
        owner_email=user.get("email"),
        is_approved=False,
        lat=spot.lat,
        lng=spot.lng,
        slug=generate_slug(spot.name),
        is_public=spot.is_public,
        public_transport=spot.public_transport,
    )

    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)

    db_spot_category = SpotCategory(
        spot_id=db_spot.id,
        category_id=spot.category_id,
        is_primary=True,
    )
    db.add(db_spot_category)
    db.commit()

    db_spot = (
        db.query(SpotDB)
        .options(joinedload(SpotDB.category))
        .filter(SpotDB.id == db_spot.id)
        .first()
    )
    return db_spot


@router.get("/spots/ids")
def get_spot_ids(db: Session = Depends(get_db)):
    rows = db.query(SpotDB.id, SpotDB.slug).filter(SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None), SpotDB.slug != None).all()
    return [{"id": r.id, "slug": r.slug} for r in rows]


@router.get("/spots/check-name")
@limiter.limit("20/minute")
async def check_spot_name(request: Request, name: str, db: Session = Depends(get_db)):
    existing = db.query(SpotDB).filter(func.lower(SpotDB.name) == func.lower(name)).first()
    return {"exists": existing is not None}


def build_spots_filter_query(
    db: Session,
    activity: Optional[str] = None,
    department: Optional[str] = None,
    difficulty: Optional[List[str]] = None,
    duration: Optional[List[str]] = None,
    distance: Optional[List[str]] = None,
    parking: Optional[bool] = None,
    potable_water: Optional[bool] = None,
    pet_friendly: Optional[bool] = None,
    kids_friendly: Optional[bool] = None,
    bathrooms: Optional[bool] = None,
    camping_amenity: Optional[bool] = None,
    water_type: Optional[List[str]] = None,
    kayak_difficulty: Optional[List[str]] = None,
    kayak_duration: Optional[List[str]] = None,
    rental_available: Optional[bool] = None,
    class_type: Optional[List[str]] = None,
    surf_duration: Optional[List[str]] = None,
    equipment_included: Optional[bool] = None,
    has_surf_school: Optional[bool] = None,
    climbing_type: Optional[List[str]] = None,
    grade_range: Optional[List[str]] = None,
    no_restrictions: Optional[bool] = None,
    amenity_ids: Optional[List[int]] = None,
    price_range: Optional[List[str]] = None,
    sort: Optional[str] = "recent",  # recent | oldest
):
    """Arma la query de /spots con todos los filtros de actividad, sin los
    joinedload/selectinload (esos los agrega cada caller aparte, según qué
    necesite: GET /spots quiere el payload completo, GET /spots/pins solo
    lo mínimo para el mapa). Compartida entre los dos para que nunca puedan
    desincronizarse los filtros que ve la lista y los que ve el mapa."""
    query = db.query(SpotDB).filter(SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))

    if department:
        query = query.filter(SpotDB.department == department)

    if activity:
        activity_list = [a.strip() for a in activity.split(",") if a.strip()]
        query = (
            query.join(SpotDB.spot_categories)
            .join(SpotCategory.category)
            .filter(models.Category.name.in_(activity_list))
            .distinct()
        )

    is_trekking = activity == "Trekking"
    routes_joined = False

    if is_trekking and difficulty:
        query = query.join(SpotDB.routes).filter(Route.difficulty.in_(difficulty))
        routes_joined = True

    if is_trekking and duration:
        if not routes_joined:
            query = query.join(SpotDB.routes)
            routes_joined = True
        dur_conds = []
        for d in duration:
            if d == "corta":   dur_conds.append(Route.duration_hours < 2)
            elif d == "media": dur_conds.append(and_(Route.duration_hours >= 2, Route.duration_hours <= 5))
            elif d == "larga": dur_conds.append(Route.duration_hours > 5)
        if dur_conds:
            query = query.filter(or_(*dur_conds))

    if is_trekking and distance:
        if not routes_joined:
            query = query.join(SpotDB.routes)
            routes_joined = True
        dist_conds = []
        for d in distance:
            if d == "corta":   dist_conds.append(Route.distance_km < 5)
            elif d == "media": dist_conds.append(and_(Route.distance_km >= 5, Route.distance_km <= 15))
            elif d == "larga": dist_conds.append(Route.distance_km > 15)
        if dist_conds:
            query = query.filter(or_(*dist_conds))

    if routes_joined:
        query = query.distinct()

    amenity_filters = {
        "parking": parking,
        "potable_water": potable_water,
        "pet_friendly": pet_friendly,
        "kids_friendly": kids_friendly,
        "bathrooms": bathrooms,
        "fire_pits": camping_amenity,
    }
    active_amenity = {k: v for k, v in amenity_filters.items() if v is not None}
    if is_trekking and active_amenity:
        query = query.outerjoin(SpotDB.trekking_detail)
        for field, val in active_amenity.items():
            query = query.filter(getattr(TrekkingDetail, field) == val)

    is_kayak = activity == "Kayak"
    kayak_joined = False

    if is_kayak and water_type:
        query = query.outerjoin(SpotDB.kayak_detail).filter(KayakDetail.water_type.in_(water_type))
        kayak_joined = True

    if is_kayak and kayak_difficulty:
        if not kayak_joined:
            query = query.outerjoin(SpotDB.kayak_detail)
            kayak_joined = True
        query = query.filter(KayakDetail.difficulty.in_(kayak_difficulty))

    if is_kayak and kayak_duration:
        if not kayak_joined:
            query = query.outerjoin(SpotDB.kayak_detail)
            kayak_joined = True
        kd_conds = []
        for d in kayak_duration:
            if d == "corta":   kd_conds.append(KayakDetail.duration < 2)
            elif d == "media": kd_conds.append(and_(KayakDetail.duration >= 2, KayakDetail.duration <= 5))
            elif d == "larga": kd_conds.append(KayakDetail.duration > 5)
        if kd_conds:
            query = query.filter(or_(*kd_conds))

    if is_kayak and rental_available is not None:
        if not kayak_joined:
            query = query.outerjoin(SpotDB.kayak_detail)
            kayak_joined = True
        query = query.filter(KayakDetail.rental_available == rental_available)

    if kayak_joined:
        query = query.distinct()

    is_surf = activity == "Surf"
    surf_joined = False

    if is_surf and class_type:
        query = query.outerjoin(SpotDB.surf_schools).filter(SurfSchool.class_type.in_(class_type))
        surf_joined = True

    if is_surf and surf_duration:
        if not surf_joined:
            query = query.outerjoin(SpotDB.surf_schools)
            surf_joined = True
        sd_conds = []
        for d in surf_duration:
            if d == "corta":   sd_conds.append(SurfSchool.duration < 2)
            elif d == "media": sd_conds.append(and_(SurfSchool.duration >= 2, SurfSchool.duration <= 5))
            elif d == "larga": sd_conds.append(SurfSchool.duration > 5)
        if sd_conds:
            query = query.filter(or_(*sd_conds))

    if is_surf and equipment_included is not None:
        if not surf_joined:
            query = query.outerjoin(SpotDB.surf_schools)
            surf_joined = True
        query = query.filter(SurfSchool.equipment_include == equipment_included)

    if is_surf and has_surf_school:
        if not surf_joined:
            query = query.outerjoin(SpotDB.surf_schools)
            surf_joined = True
        query = query.filter(SurfSchool.id != None)

    if surf_joined:
        query = query.distinct()

    is_climbing = activity == "Escalada"
    climbing_joined = False

    if is_climbing and climbing_type:
        query = query.outerjoin(SpotDB.climbing_sectors).filter(ClimbingSector.type.in_(climbing_type))
        climbing_joined = True

    if is_climbing and grade_range:
        if not climbing_joined:
            query = query.outerjoin(SpotDB.climbing_sectors)
            climbing_joined = True
        query = query.outerjoin(ClimbingSector.routes)
        gr_conds = []
        for g in grade_range:
            if g == "principiante": gr_conds.append(ClimbingRoute.grade <= "5c")
            elif g == "intermedio": gr_conds.append(and_(ClimbingRoute.grade >= "6a", ClimbingRoute.grade <= "6c+"))
            elif g == "avanzado":   gr_conds.append(and_(ClimbingRoute.grade >= "7a", ClimbingRoute.grade <= "7c+"))
            elif g == "experto":    gr_conds.append(ClimbingRoute.grade >= "8a")
        if gr_conds:
            query = query.filter(or_(*gr_conds))

    if is_climbing and no_restrictions:
        if not climbing_joined:
            query = query.outerjoin(SpotDB.climbing_sectors)
            climbing_joined = True
        query = query.filter(
            or_(ClimbingSector.restrictions == None, ClimbingSector.restrictions == "")
        )

    if climbing_joined:
        query = query.distinct()

    is_camping = activity == "Camping"

    if is_camping and amenity_ids:
        for amenity_id in amenity_ids:
            query = query.filter(
                SpotDB.id.in_(
                    db.query(SpotAmenity.spot_id)
                    .filter(SpotAmenity.amenity_id == amenity_id)
                    .scalar_subquery()
                )
            )

    if is_camping and price_range:
        query = query.outerjoin(SpotDB.camping_detail)
        pr_conds = []
        for p in price_range:
            if p == "gratis":
                pr_conds.append(or_(CampingDetail.price == 0, CampingDetail.price == None))
            elif p == "bajo":
                pr_conds.append(and_(CampingDetail.price > 0, CampingDetail.price < 300))
            elif p == "medio":
                pr_conds.append(and_(CampingDetail.price >= 300, CampingDetail.price <= 800))
            elif p == "alto":
                pr_conds.append(CampingDetail.price > 800)
        if pr_conds:
            query = query.filter(or_(*pr_conds))

    if sort == "oldest":
        query = query.order_by(SpotDB.created_at.asc())
    else:
        query = query.order_by(SpotDB.created_at.desc())

    return query


@router.get("/spots", response_model=list[SpotResponse])
def get_spots(
    response: Response,
    db: Session = Depends(get_db),
    activity: Optional[str] = None,
    department: Optional[str] = None,
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
    sort: Optional[str] = Query(default="recent"),  # recent | oldest
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = build_spots_filter_query(
        db, activity=activity, department=department, difficulty=difficulty,
        duration=duration, distance=distance, parking=parking, potable_water=potable_water,
        pet_friendly=pet_friendly, kids_friendly=kids_friendly, bathrooms=bathrooms,
        camping_amenity=camping_amenity, water_type=water_type, kayak_difficulty=kayak_difficulty,
        kayak_duration=kayak_duration, rental_available=rental_available, class_type=class_type,
        surf_duration=surf_duration, equipment_included=equipment_included, has_surf_school=has_surf_school,
        climbing_type=climbing_type, grade_range=grade_range, no_restrictions=no_restrictions,
        amenity_ids=amenity_ids, price_range=price_range, sort=sort,
    )

    # Total antes de paginar — calculado antes de sumar los joinedload/
    # selectinload de abajo, para que no interfieran con el count().
    # order_by(None) es necesario: build_spots_filter_query ya le aplicó un
    # ORDER BY created_at, y Postgres exige que las columnas del ORDER BY
    # estén en el SELECT cuando hay DISTINCT (SQLite no lo exige, por eso
    # esto pasaba los tests locales pero rompía en producción).
    total = query.order_by(None).with_entities(SpotDB.id).distinct().count()
    response.headers["X-Total-Count"] = str(total)

    query = query.options(
        joinedload(SpotDB.category),
        joinedload(SpotDB.amenities).joinedload(SpotAmenity.amenity),
        joinedload(SpotDB.images),
        selectinload(SpotDB.glamping_detail),
        selectinload(SpotDB.glamping_amenities),
    )
    spots = query.limit(limit).offset(offset).all()

    spot_ids = [s.id for s in spots]
    review_aggs = (
        db.query(
            models.Review.spot_id,
            func.avg(models.Review.rating).label("average_rating"),
            func.count(models.Review.id).label("review_count"),
        )
        .filter(models.Review.spot_id.in_(spot_ids))
        .group_by(models.Review.spot_id)
        .all()
    ) if spot_ids else []
    agg_by_id = {r.spot_id: r for r in review_aggs}

    result = []
    for spot in spots:
        amenities = [sa.amenity for sa in spot.amenities if sa.amenity is not None]
        agg = agg_by_id.get(spot.id)
        sorted_spot_categories = sorted(spot.spot_categories, key=lambda sc: not sc.is_primary)
        categories = [sc.category for sc in sorted_spot_categories]
        item = {
            **spot.__dict__,
            "amenities": amenities,
            "categories": categories,
            "glamping_detail": spot.glamping_detail,
            "glamping_amenities": spot.glamping_amenities,
            "average_rating": round(float(agg.average_rating), 1) if agg else None,
            "review_count": agg.review_count if agg else 0,
        }
        item.pop("owner_email", None)
        item.pop("owner_phone", None)
        result.append(item)

    return result


@router.get("/spots/pins")
def get_spot_pins(
    db: Session = Depends(get_db),
    activity: Optional[str] = None,
    department: Optional[str] = None,
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
    sort: Optional[str] = Query(default="recent"),
):
    """Para el mapa de /search: los mismos filtros que GET /spots, pero sin
    paginar (el mapa necesita todos los pines que matcheen) y con el payload
    mínimo que usa SpotsMap.jsx — nada de imágenes/amenities/rutas/reviews,
    que es lo que hace pesado a GET /spots."""
    query = build_spots_filter_query(
        db, activity=activity, department=department, difficulty=difficulty,
        duration=duration, distance=distance, parking=parking, potable_water=potable_water,
        pet_friendly=pet_friendly, kids_friendly=kids_friendly, bathrooms=bathrooms,
        camping_amenity=camping_amenity, water_type=water_type, kayak_difficulty=kayak_difficulty,
        kayak_duration=kayak_duration, rental_available=rental_available, class_type=class_type,
        surf_duration=surf_duration, equipment_included=equipment_included, has_surf_school=has_surf_school,
        climbing_type=climbing_type, grade_range=grade_range, no_restrictions=no_restrictions,
        amenity_ids=amenity_ids, price_range=price_range, sort=sort,
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


@router.delete("/spots/{spot_id}")
def delete_spot(spot_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    db_spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not db_spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    images = db.query(SpotImage).filter(SpotImage.spot_id == spot_id).all()
    for img in images:
        try:
            print(f"[Cloudinary] Destruyendo: {img.cloudinary_public_id}")
            result = cloudinary.uploader.destroy(img.cloudinary_public_id)
            print(f"[Cloudinary] Resultado: {result}")
        except Exception as e:
            print(f"[Cloudinary] Error: {e}")

    # Antes esto era un DELETE FROM spots crudo, que rompía con
    # IntegrityError apenas el spot tenía cualquier fila asociada (reviews,
    # detalles, categorías, etc.) — ninguna FK tenía cascada. Ahora que los
    # relationships de SpotDB tienen cascade="all, delete-orphan", db.delete
    # hace que SQLAlchemy arme el orden de DELETEs solo.
    db.delete(db_spot)
    db.commit()

    return {"message": "Spot deleted"}


@router.get("/spots/by-slug/{slug}", response_model=SpotResponse)
def get_spot_by_slug(slug: str, db: Session = Depends(get_db)):
    spot = (
        db.query(SpotDB)
        .options(
            selectinload(SpotDB.category),
            selectinload(SpotDB.routes),
            selectinload(SpotDB.amenities).selectinload(SpotAmenity.amenity),
            selectinload(SpotDB.images),
            selectinload(SpotDB.trekking_detail),
            selectinload(SpotDB.glamping_detail),
            selectinload(SpotDB.glamping_amenities),
            selectinload(SpotDB.motorhome_detail),
            selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category),
            selectinload(SpotDB.experiences).selectinload(Experience.category),
        )
        .filter(SpotDB.slug == slug, SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None))
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    # Antes esto devolvía average_rating/review_count hardcodeados en None/0
    # — mismo cálculo real que ya usa GET /spots, pero para un solo spot.
    agg = (
        db.query(
            func.avg(models.Review.rating).label("average_rating"),
            func.count(models.Review.id).label("review_count"),
        )
        .filter(models.Review.spot_id == spot.id)
        .first()
    )
    average_rating = round(float(agg.average_rating), 1) if agg and agg.average_rating else None
    review_count = agg.review_count if agg else 0

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
        "season_start": spot.season_start,
        "season_end": spot.season_end,
        "slug": spot.slug,
        "created_at": spot.created_at,
        "category": spot.category,
        "categories": [sc.category for sc in spot.spot_categories],
        "camping_detail": spot.camping_detail,
        "glamping_detail": spot.glamping_detail,
        "glamping_amenities": spot.glamping_amenities,
        "motorhome_detail": spot.motorhome_detail,
        "trekking_detail": spot.trekking_detail,
        "amenities": [sa.amenity for sa in spot.amenities if sa.amenity is not None],
        "routes": spot.routes,
        "images": sorted(spot.images, key=lambda img: (0 if img.is_main else 1, img.order, img.id)),
        "experiences": spot.experiences,
        "average_rating": average_rating,
        "review_count": review_count,
        "is_public": spot.is_public,
        "public_transport": spot.public_transport,
    }


@router.get("/spots/mine")
def get_my_spots(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    spots = (
        db.query(SpotDB)
        .options(
            joinedload(SpotDB.category),
            joinedload(SpotDB.images),
            joinedload(SpotDB.spot_categories).joinedload(SpotCategory.category),
        )
        .filter(SpotDB.owner_email == email)
        .order_by(SpotDB.created_at.desc())
        .all()
    )
    spot_ids = [s.id for s in spots]
    review_aggs = (
        db.query(
            models.Review.spot_id,
            func.avg(models.Review.rating).label("average_rating"),
            func.count(models.Review.id).label("review_count"),
        )
        .filter(models.Review.spot_id.in_(spot_ids))
        .group_by(models.Review.spot_id)
        .all()
    ) if spot_ids else []
    agg_by_id = {r.spot_id: r for r in review_aggs}
    return [
        {
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "department": s.department,
            "description": s.description,
            "email": s.email,
            "whatsapp": s.whatsapp,
            "instagram": s.instagram,
            "price": s.price,
            "season_start": s.season_start,
            "season_end": s.season_end,
            "is_public": s.is_public,
            "public_transport": s.public_transport,
            "is_approved": s.is_approved,
            "created_at": s.created_at.isoformat(),
            "category": s.category,
            "images": s.images,
            "average_rating": round(float(agg_by_id[s.id].average_rating), 1) if s.id in agg_by_id and agg_by_id[s.id].average_rating else None,
            "review_count": agg_by_id[s.id].review_count if s.id in agg_by_id else 0,
        }
        for s in spots
    ]


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
            selectinload(SpotDB.glamping_detail),
            selectinload(SpotDB.glamping_amenities),
            selectinload(SpotDB.motorhome_detail),
            selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category),
            selectinload(SpotDB.experiences).selectinload(Experience.category),
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
        "trekking_detail": spot.trekking_detail,
        "amenities": [
            sa.amenity for sa in spot.amenities if sa.amenity is not None
        ],
        "routes": spot.routes,
        "images": sorted(spot.images, key=lambda img: (0 if img.is_main else 1, img.order, img.id)),
        "experiences": spot.experiences,
        "season_start": spot.season_start,
        "season_end": spot.season_end,
        "is_public": spot.is_public,
        "public_transport": spot.public_transport,
    }

@router.post("/spots/{spot_id}/trekking-detail")
def add_trekking_detail(spot_id: int, data: TrekkingDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    detail = TrekkingDetail(spot_id=spot_id, **data.dict())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


# agrega una amenity al spot
@router.post("/spots/{spot_id}/amenities/{amenity_id}")
def add_amenity(spot_id: int, amenity_id: int, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):

    amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")

    existing = db.query(SpotAmenity).filter(
        SpotAmenity.spot_id == spot_id,
        SpotAmenity.amenity_id == amenity_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Relation already exists")

    relation = SpotAmenity(
        spot_id=spot_id,
        amenity_id=amenity_id
    )

    db.add(relation)
    db.commit()

    return {"message": "Amenity agregada"}


@router.post("/spots/{spot_id}/categories")
def add_spot_category(spot_id: int, data: SpotCategoryAddRequest, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    category = db.query(models.Category).filter(models.Category.name == data.category).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing_relation = db.query(SpotCategory).filter(
        SpotCategory.spot_id == spot_id,
        SpotCategory.category_id == category.id
    ).first()
    if existing_relation and data.category != "Glamping":
        raise HTTPException(status_code=400, detail="Spot already has this category")

    if not existing_relation:
        new_relation = SpotCategory(spot_id=spot_id, category_id=category.id, is_primary=False)
        db.add(new_relation)

    if data.category == "Motorhome" and data.motorhome_detail:
        existing_detail = db.query(MotorhomeDetail).filter(MotorhomeDetail.spot_id == spot_id).first()
        if existing_detail:
            raise HTTPException(status_code=400, detail="Spot already has motorhome details")
        detail = MotorhomeDetail(spot_id=spot_id, **data.motorhome_detail.dict())
        db.add(detail)

    elif data.category == "Camping" and data.camping_detail:
        existing_camping = db.query(CampingDetail).filter(CampingDetail.spot_id == spot_id).first()
        if existing_camping:
            raise HTTPException(status_code=400, detail="Spot already has camping details")
        camping = CampingDetail(spot_id=spot_id, price=data.camping_detail.price)
        db.add(camping)

    elif data.category == "Glamping" and data.glamping_detail:
        glamping = GlampingDetail(
            spot_id=spot_id,
            accommodation_type=data.glamping_detail.accommodation_type,
            capacity=data.glamping_detail.capacity,
            price_per_night=data.glamping_detail.price_per_night,
            min_nights=data.glamping_detail.min_nights,
        )
        db.add(glamping)

        if data.glamping_amenities:
            existing_amenities = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
            if not existing_amenities:
                amenity_row = GlampingAmenity(
                    spot_id=spot_id,
                    **data.glamping_amenities.dict(),
                )
                db.add(amenity_row)

    db.commit()

    return {"message": "Category added successfully"}


# agrega detalles del camping
@router.post("/spots/{spot_id}/camping")
def add_camping_detail(spot_id: int, data: CampingDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    
    camping = CampingDetail(
        spot_id=spot_id,
        price=data.price,
    )

    db.add(camping)
    db.commit()
    db.refresh(camping)

    return camping


@router.post("/spots/{spot_id}/motorhome")
def add_motorhome_detail(spot_id: int, data: MotorhomeDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    detail = MotorhomeDetail(
        spot_id=spot_id,
        capacity=data.capacity,
        surface_type=data.surface_type,
        has_water=data.has_water,
        has_electricity=data.has_electricity,
        has_dump_station=data.has_dump_station,
        max_stay_nights=data.max_stay_nights,
    )
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


# devuelve las rutas de trekking segun el spot
@router.get("/spots/{spot_id}/routes", response_model=list[RouteResponse])
def get_routes_by_spot(spot_id: int, db: Session = Depends(get_db)):
    return db.query(Route).filter(Route.spot_id == spot_id).all()


#devuelve los sectores de escalada segun el spot
@router.get("/spots/{spot_id}/sectors", response_model=list[ClimbingSectorResponse])
def get_sectors_by_spot(spot_id: int, db: Session = Depends(get_db)):
    sectors = db.query(ClimbingSector).filter(ClimbingSector.spot_id == spot_id).all()
    return sectors


# devuelve los detalles del kayak segun el spot
@router.get("/spots/{spot_id}/kayak-detail", response_model=list[KayakDetailResponse])
def get_kayak_detail(spot_id: int, db: Session = Depends(get_db)):
    kayaks = db.query(KayakDetail).filter(KayakDetail.spot_id == spot_id).all()
    if not kayaks:
        raise HTTPException(status_code=404, detail="Kayak no encontrado")
    return kayaks


# edvuelve las escuelas de surf segun el spot
@router.get("/spots/{spot_id}/surf-schools", response_model=list[SurfSchoolResponse])
def get_surf_schools(spot_id: int, db: Session = Depends(get_db)):
    return db.query(SurfSchool).filter(SurfSchool.spot_id == spot_id).all()


@router.get("/admin/spots")
def get_all_spots_admin(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    spots = (
        db.query(SpotDB)
        .options(
            joinedload(SpotDB.category),
            joinedload(SpotDB.images),
        )
        .order_by(SpotDB.is_approved.asc(), SpotDB.id.desc())
        .all()
    )
    spot_ids = [s.id for s in spots]
    review_counts = dict(
        db.query(models.Review.spot_id, func.count(models.Review.id))
        .filter(models.Review.spot_id.in_(spot_ids))
        .group_by(models.Review.spot_id)
        .all()
    ) if spot_ids else {}
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "department": s.department,
            "is_approved": s.is_approved,
            "category": s.category,
            "images": s.images,
            "owner_email": s.owner_email,
            "owner_deleted_at": s.owner_deleted_at,
            "slug": s.slug,
            "created_at": s.created_at,
            "review_count": review_counts.get(s.id, 0),
        }
        for s in spots
    ]


@router.patch("/admin/spots/{spot_id}/reactivate")
def reactivate_spot(spot_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    # No usa get_owned_spot_or_admin: si el spot está acá es porque su dueño
    # borró la cuenta, ya no hay ningún dueño legítimo que autorizar — es
    # una decisión exclusiva del admin.
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    spot.owner_deleted_at = None
    db.commit()
    return {"id": spot.id}


@router.patch("/admin/spots/{spot_id}/approve")
def approve_spot(spot_id: int, approved: bool, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    spot.is_approved = approved
    if approved and not spot.slug:
        spot.slug = generate_slug(spot.name)
    db.commit()
    return {"id": spot.id, "is_approved": spot.is_approved}


@router.get("/spots/{spot_id}/can-upload")
def can_upload_image(public_id: str, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    # get_owned_spot_or_admin ya garantiza que spot_id es del usuario (o admin).
    # Además, ese public_id no puede estar ya usado por OTRO spot — evita que
    # alguien pise la foto de un spot ajeno subiendo a un spot propio con el
    # mismo nombre/categoría (mismo public_id calculado).
    existing = db.query(SpotImage).filter(SpotImage.cloudinary_public_id == public_id).first()
    if existing and existing.spot_id != spot.id:
        raise HTTPException(status_code=409, detail="Ese public_id ya está en uso por otro spot")
    return {"ok": True}


@router.patch("/admin/spots/{spot_id}")
def edit_spot_admin(data: dict, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    allowed = ["name", "description", "department", "email", "whatsapp", "instagram", "price", "lat", "lng", "is_public", "public_transport", "season_start", "season_end"]
    for field, value in data.items():
        if field in allowed:
            setattr(spot, field, value)
    db.commit()
    db.refresh(spot)
    return {"id": spot.id, "name": spot.name}


@router.patch("/admin/spots/{spot_id}/main-image")
def set_main_image(data: dict, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    public_id = data.get("cloudinary_public_id")
    images = db.query(SpotImage).filter(SpotImage.spot_id == spot.id).all()
    for img in images:
        img.is_main = (img.cloudinary_public_id == public_id)
    db.commit()
    return {"ok": True}


@router.delete("/admin/images/{public_id:path}")
def delete_image(public_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    img = db.query(SpotImage).filter(SpotImage.cloudinary_public_id == public_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    spot = db.query(SpotDB).filter(SpotDB.id == img.spot_id).first()
    if not is_admin(user) and (not spot or spot.owner_email != user.get("email")):
        raise HTTPException(status_code=403, detail="No autorizado")
    db.delete(img)
    db.commit()
    return {"ok": True}


@router.post("/spots/{spot_id}/experiences", response_model=ExperienceResponse)
def create_experience(spot_id: int, data: ExperienceCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    category = db.query(models.Category).filter(models.Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    experience = Experience(spot_id=spot_id, **data.dict())
    db.add(experience)
    db.flush()

    existing_sc = db.query(SpotCategory).filter(
        SpotCategory.spot_id == spot_id,
        SpotCategory.category_id == data.category_id,
    ).first()
    if not existing_sc:
        db.add(SpotCategory(spot_id=spot_id, category_id=data.category_id, is_primary=False))

    db.commit()
    db.refresh(experience)
    experience.category
    return experience


@router.get("/spots/{spot_id}/experiences", response_model=list[ExperienceResponse])
def get_experiences(spot_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Experience)
        .options(selectinload(Experience.category))
        .filter(Experience.spot_id == spot_id, Experience.is_active == True)
        .all()
    )


@router.delete("/spots/{spot_id}/experiences/{experience_id}")
def delete_experience(spot_id: int, experience_id: int, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.spot_id == spot_id,
    ).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    category_id = experience.category_id
    db.delete(experience)
    db.flush()

    remaining = db.query(Experience).filter(
        Experience.spot_id == spot_id,
        Experience.category_id == category_id,
    ).count()

    if remaining == 0:
        db.query(SpotCategory).filter(
            SpotCategory.spot_id == spot_id,
            SpotCategory.category_id == category_id,
        ).delete()

    db.commit()
    return {"message": "Experience deleted"}