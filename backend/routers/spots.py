from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import get_current_user
from limiter import limiter
from models import SpotDB, SpotAmenity, ClimbingSector, CampingDetail, TrekkingDetail, Route, KayakDetail, SurfSchool
from schemas import SpotCreate, SpotResponse, ClimbingSectorResponse, CampingDetailCreate, TrekkingDetailCreate, RouteResponse, SurfSchoolResponse, KayakDetailResponse
import models
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_, and_
from typing import Optional, List
from database import engine
from models import Base
import re

Base.metadata.create_all(bind=engine)


router = APIRouter()


def generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[áàäâ]', 'a', slug)
    slug = re.sub(r'[éèëê]', 'e', slug)
    slug = re.sub(r'[íìïî]', 'i', slug)
    slug = re.sub(r'[óòöô]', 'o', slug)
    slug = re.sub(r'[úùüû]', 'u', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def home():
    return {"message": "Spots API running"}

# Crear un spot
# usa la sesion para hablar con la DB
@router.post("/spots", response_model=SpotResponse)
@limiter.limit("10/minute")
async def create_spot(request: Request, spot: SpotCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):

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
        owner_email=spot.owner_email,
        is_approved=spot.is_approved,
        lat=spot.lat,
        lng=spot.lng,
        slug=generate_slug(spot.name),
    )

    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)

    db_spot = (
        db.query(SpotDB)
        .options(joinedload(SpotDB.category))
        .filter(SpotDB.id == db_spot.id)
        .first()
    )
    return db_spot


@router.get("/spots/ids")
def get_spot_ids(db: Session = Depends(get_db)):
    rows = db.query(SpotDB.id, SpotDB.slug).filter(SpotDB.is_approved == True, SpotDB.slug != None).all()
    return [{"id": r.id, "slug": r.slug} for r in rows]


@router.get("/spots", response_model=list[SpotResponse])
def get_spots(
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
):
    query = db.query(SpotDB).options(
        joinedload(SpotDB.category),
        joinedload(SpotDB.amenities).joinedload(SpotAmenity.amenity),
        joinedload(SpotDB.images)
    ).filter(SpotDB.is_approved == True)

    if department:
        query = query.filter(SpotDB.department == department)

    if activity:
        query = query.join(SpotDB.category).filter(models.Category.name == activity)

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

    spots = query.all()

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
        result.append({
            **spot.__dict__,
            "amenities": amenities,
            "average_rating": round(float(agg.average_rating), 1) if agg else None,
            "review_count": agg.review_count if agg else 0,
        })

    return result


@router.delete("/spots/{spot_id}")
def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    db_spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()

    if not db_spot:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(db_spot)
    db.commit()

    return {"message": "Trip deleted"}


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
        )
        .filter(SpotDB.slug == slug, SpotDB.is_approved == True)
        .first()
    )
    if not spot:
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
        "season_start": spot.season_start,
        "season_end": spot.season_end,
        "slug": spot.slug,
        "category": spot.category,
        "camping_detail": spot.camping_detail,
        "trekking_detail": spot.trekking_detail,
        "amenities": [sa.amenity for sa in spot.amenities if sa.amenity is not None],
        "routes": spot.routes,
        "images": spot.images,
        "average_rating": None,
        "review_count": 0,
    }


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
        )
        .filter(SpotDB.id == id)
        .first()
    )

    if not spot or not spot.is_approved:
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
        "category": spot.category,
        "camping_detail": spot.camping_detail,
        "trekking_detail": spot.trekking_detail,
        "amenities": [
            sa.amenity for sa in spot.amenities if sa.amenity is not None
        ],
        "routes": spot.routes,
        "images": spot.images,
        "season_start": spot.season_start,
        "season_end": spot.season_end,
    }

@router.post("/spots/{spot_id}/trekking-detail")
def add_trekking_detail(spot_id: int, data: TrekkingDetailCreate, db: Session = Depends(get_db)):
    detail = TrekkingDetail(spot_id=spot_id, **data.dict())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


# agrega una amenity al spot
@router.post("/spots/{spot_id}/amenities/{amenity_id}")
def add_amenity(spot_id: int, amenity_id: int, db: Session = Depends(get_db)):

    spot = db.query(models.SpotDB).filter(models.SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

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


# devuelve los sectores segun el spot
@router.get("/{spot_id}/sectors", response_model=list[ClimbingSectorResponse])
def get_sectors_by_spot(spot_id: int, db: Session = Depends(get_db)):
    return db.query(ClimbingSector).filter(ClimbingSector.spot_id == spot_id).all()


# agrega detalles del camping
@router.post("/spots/{spot_id}/camping")
def add_camping_detail(spot_id: int, data: CampingDetailCreate, db: Session = Depends(get_db)):
    
    camping = CampingDetail(
        spot_id=spot_id,
        price=data.price,
    )

    db.add(camping)
    db.commit()
    db.refresh(camping)

    return camping


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