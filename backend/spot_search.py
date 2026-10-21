"""La búsqueda de lugares: filtros, orden y distancia (GET /spots, /spots/nearby y
la home). Antes vivía en routers/spots.py."""
import math
from sqlalchemy.orm import Session
from models import SpotDB, SpotAmenity, ClimbingSector, ClimbingRoute, TrekkingDetail, Route, SurfDetail, KayakServiceDetail, GlampingDetail, SpotCategory, MotorhomeDetail, GlampingAmenity
import models
from sqlalchemy import func, or_, and_, case, select
import home as home_domain
from typing import Optional, List


NEARBY_RADIUS_KM = 1.0


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia entre dos puntos (haversine)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


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
    reservation_required: Optional[bool] = None,
    cell_signal: Optional[bool] = None,
    glamping_price: Optional[List[str]] = None,
    glamping_amenity: Optional[List[str]] = None,
    motorhome_service: Optional[List[str]] = None,
    sort: Optional[str] = "recent",  # recent | oldest | recommended | rating | name
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

    # Mascotas: dato del lugar, para cualquier actividad (antes era solo de
    # trekking, y en camping un amenity aparte).
    if pet_friendly is not None:
        query = query.filter(SpotDB.pets_allowed == pet_friendly)
    # Reserva y señal, como mascotas: datos del lugar, para cualquier actividad.
    if reservation_required is not None:
        query = query.filter(SpotDB.reservation_required == reservation_required)
    if cell_signal is not None:
        query = query.filter(SpotDB.cell_signal == cell_signal)

    amenity_filters = {
        "parking": parking,
        "potable_water": potable_water,
        "kids_friendly": kids_friendly,
        "bathrooms": bathrooms,
        "fire_pits": camping_amenity,
    }
    active_amenity = {k: v for k, v in amenity_filters.items() if v is not None}
    if is_trekking and active_amenity:
        query = query.outerjoin(SpotDB.trekking_detail)
        for field, val in active_amenity.items():
            query = query.filter(getattr(TrekkingDetail, field) == val)

    # Surf y kayak: los filtros son de las escuelas y los servicios (lugares
    # con surf_detail / kayak_service_detail); las playas y lagunas no los
    # tienen, así que con un filtro puesto quedan afuera.
    def ranges(column, values):
        conds = []
        for d in values or []:
            if d == "corta":   conds.append(column < 2)
            elif d == "media": conds.append(and_(column >= 2, column <= 5))
            elif d == "larga": conds.append(column > 5)
        return conds

    if activity == "Kayak":
        kayak_conds = []
        if water_type:
            kayak_conds.append(KayakServiceDetail.water_type.in_(water_type))
        if kayak_difficulty:
            kayak_conds.append(KayakServiceDetail.difficulty.in_(kayak_difficulty))
        if ranges(KayakServiceDetail.duration, kayak_duration):
            kayak_conds.append(or_(*ranges(KayakServiceDetail.duration, kayak_duration)))
        if rental_available is not None:
            kayak_conds.append(KayakServiceDetail.rental_available == rental_available)
        if kayak_conds:
            query = query.join(SpotDB.kayak_service_detail).filter(*kayak_conds)

    if activity == "Surf":
        surf_conds = []
        if class_type:
            surf_conds.append(SurfDetail.class_type.in_(class_type))
        if ranges(SurfDetail.duration, surf_duration):
            surf_conds.append(or_(*ranges(SurfDetail.duration, surf_duration)))
        if equipment_included is not None:
            surf_conds.append(SurfDetail.equipment_include == equipment_included)
        # "Solo escuelas": sin las playas.
        if surf_conds or has_surf_school:
            query = query.join(SpotDB.surf_detail).filter(*surf_conds)

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
        # El precio del lugar: el que edita el dueño y muestra la card.
        pr_conds = []
        for p in price_range:
            if p == "gratis":
                pr_conds.append(or_(SpotDB.price == 0, SpotDB.price == None))
            elif p == "bajo":
                pr_conds.append(and_(SpotDB.price > 0, SpotDB.price < 300))
            elif p == "medio":
                pr_conds.append(and_(SpotDB.price >= 300, SpotDB.price <= 800))
            elif p == "alto":
                pr_conds.append(SpotDB.price > 800)
        if pr_conds:
            query = query.filter(or_(*pr_conds))

    if activity == "Glamping" and glamping_price:
        # Por el alojamiento más barato del lugar (lo que muestra la card).
        cheapest = (
            db.query(GlampingDetail.spot_id, func.min(GlampingDetail.price_per_night).label("p"))
            .filter(GlampingDetail.price_per_night > 0)
            .group_by(GlampingDetail.spot_id).subquery()
        )
        ranges = {
            "bajo": cheapest.c.p < GLAMPING_PRICE_LOW,
            "medio": and_(cheapest.c.p >= GLAMPING_PRICE_LOW, cheapest.c.p <= GLAMPING_PRICE_HIGH),
            "alto": cheapest.c.p > GLAMPING_PRICE_HIGH,
        }
        conds = [ranges[r] for r in glamping_price if r in ranges]
        if conds:
            query = query.filter(SpotDB.id.in_(select(cheapest.c.spot_id).where(or_(*conds))))

    if activity == "Glamping" and glamping_amenity:
        for key in glamping_amenity:
            if key in GLAMPING_AMENITY_FILTERS:
                query = query.filter(SpotDB.id.in_(
                    select(GlampingAmenity.spot_id).where(getattr(GlampingAmenity, key) == True)  # noqa: E712
                ))

    if activity == "Motorhome" and motorhome_service:
        for service in motorhome_service:
            column = MOTORHOME_SERVICE_FILTERS.get(service)
            if column is not None:
                query = query.filter(SpotDB.id.in_(select(MotorhomeDetail.spot_id).where(column == True)))  # noqa: E712

    return sort_spots(db, query, sort, services_first=activity in ("Surf", "Kayak"))


# Precio por noche del glamping (pesos), para los rangos del filtro.
GLAMPING_PRICE_LOW, GLAMPING_PRICE_HIGH = 3000, 6000
GLAMPING_AMENITY_FILTERS = {
    "private_bathroom", "electricity", "wifi", "breakfast_included", "heating",
    "air_conditioning", "kitchen", "towels_included", "parking",
}
MOTORHOME_SERVICE_FILTERS = {
    "water": MotorhomeDetail.has_water,
    "electricity": MotorhomeDetail.has_electricity,
    "dump": MotorhomeDetail.has_dump_station,
}


def sort_spots(db: Session, query, sort: Optional[str], services_first: bool = False):
    """Ordena los lugares que dejaron los filtros. Primero se toman solo los
    ids (los filtros pueden usar DISTINCT, y Postgres no deja ordenar un
    DISTINCT por algo que no esté en el SELECT) y el orden va afuera.
    - recommended: la puntuación de populares (home.py); lo que no la tiene,
      lo más nuevo primero.
    - rating: el promedio de reseñas (y la cantidad, para desempatar); los
      que no tienen reseñas, al final (nullslast: en Postgres un DESC pone
      los NULL primero).
    - name: alfabético.
    - recent / oldest: por fecha de carga.
    En surf y kayak (services_first) primero van las escuelas y servicios y
    después las playas y lagunas, cada grupo con ese orden."""
    ids = query.order_by(None).with_entities(SpotDB.id.label("id")).distinct().subquery()
    base = db.query(SpotDB).filter(SpotDB.id.in_(select(ids.c.id)))
    if services_first:
        is_service = or_(
            select(SurfDetail.id).where(SurfDetail.spot_id == SpotDB.id).exists(),
            select(KayakServiceDetail.id).where(KayakServiceDetail.spot_id == SpotDB.id).exists(),
        )
        base = base.order_by(case((is_service, 0), else_=1))
    if sort == "name":
        return base.order_by(func.lower(SpotDB.name), SpotDB.id)
    if sort == "rating":
        agg = (
            db.query(models.Review.spot_id.label("sid"), func.avg(models.Review.rating).label("avg"), func.count(models.Review.id).label("n"))
            .group_by(models.Review.spot_id).subquery()
        )
        return base.outerjoin(agg, agg.c.sid == SpotDB.id).order_by(
            agg.c.avg.desc().nullslast(), agg.c.n.desc().nullslast(), SpotDB.created_at.desc(), SpotDB.id,
        )
    if sort == "recommended":
        scores = home_domain.popularity(db)
        if scores:
            score = case(scores, value=SpotDB.id, else_=0.0)
            return base.order_by(score.desc(), SpotDB.created_at.desc(), SpotDB.id)
        return base.order_by(SpotDB.created_at.desc(), SpotDB.id)
    if sort == "oldest":
        return base.order_by(SpotDB.created_at.asc(), SpotDB.id)
    return base.order_by(SpotDB.created_at.desc(), SpotDB.id)
