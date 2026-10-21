"""Cómo se devuelve un lugar: en los listados (SpotCard) y en su página.
Antes vivía en routers/spots.py."""
from sqlalchemy.orm import Session
from models import SpotDB, SpotAmenity, ClimbingSector, SpotCategory, Experience
from schemas import SurfDetailIn, KayakServiceDetailIn
import models
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from routers.sectors import _attach_sector_stats


# Lo que carga cada lugar de un listado (GET /spots, la home).
SPOT_LIST_OPTIONS = (
    joinedload(SpotDB.category),
    joinedload(SpotDB.amenities).joinedload(SpotAmenity.amenity),
    joinedload(SpotDB.images),
    selectinload(SpotDB.glamping_detail),
    selectinload(SpotDB.glamping_amenities),
    selectinload(SpotDB.surf_detail),
    selectinload(SpotDB.kayak_service_detail),
    # serialize_spot_list lee las categorías de cada lugar: sin esto eran una
    # consulta por lugar (24 de más en una página de la búsqueda).
    selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category),
)


# Columnas del lugar que no salen en los listados públicos (home, cercanos,
# favoritos): datos de personas y de la moderación. Antes solo se sacaban
# owner_email y owner_phone, y la home mostraba el email de quien sugirió el
# lugar y el motivo de un rechazo.
PRIVATE_SPOT_FIELDS = (
    "owner_email", "owner_phone", "suggested_by_email",
    "rejection_reason", "rejected_at", "owner_deleted_at", "spot_categories",
)


def serialize_spot_list(db: Session, spots: list) -> list[dict]:
    """Los lugares como los muestra SpotCard, con su puntaje de reseñas."""
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
            # Escuela / servicio: la card muestra "Desde $X por clase".
            "surf_detail": SurfDetailIn.model_validate(spot.surf_detail).model_dump() if spot.surf_detail else None,
            "kayak_service_detail": KayakServiceDetailIn.model_validate(spot.kayak_service_detail).model_dump() if spot.kayak_service_detail else None,
            "average_rating": round(float(agg.average_rating), 1) if agg else None,
            "review_count": agg.review_count if agg else 0,
        }
        for field in PRIVATE_SPOT_FIELDS:
            item.pop(field, None)
        result.append(item)

    return result


# Lo que se carga de un lugar para mostrar su página (por slug y en la vista
# previa del admin y del dueño).
SPOT_DETAIL_OPTIONS = (
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


def spot_detail(db: Session, spot: SpotDB) -> dict:
    """La página de un lugar: todos sus datos y su puntaje de reseñas."""
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
        # Para la vista previa (en la página pública siempre es True).
        "is_approved": bool(spot.is_approved),
        "created_at": spot.created_at,
        # "Última actualización" (models.touch_spot_info).
        "info_updated_at": spot.info_updated_at or spot.created_at,
        "category": spot.category,
        "categories": [sc.category for sc in spot.spot_categories],
        "camping_detail": spot.camping_detail,
        "glamping_detail": spot.glamping_detail,
        "glamping_amenities": spot.glamping_amenities,
        "motorhome_detail": spot.motorhome_detail,
        "surf_detail": spot.surf_detail,
        "kayak_service_detail": spot.kayak_service_detail,
        "trekking_detail": spot.trekking_detail,
        "amenities": [sa.amenity for sa in spot.amenities if sa.amenity is not None],
        "routes": spot.routes,
        "images": sorted(spot.images, key=lambda img: (0 if img.is_main else 1, img.order, img.id)),
        "experiences": spot.experiences,
        "climbing_sectors": [_attach_sector_stats(sec) for sec in spot.climbing_sectors],
        "average_rating": average_rating,
        "review_count": review_count,
        "is_public": spot.is_public,
        "public_transport": spot.public_transport,
        # Lo sugirió un visitante: la página avisa que está a confirmar y
        # ofrece reclamarlo (claims.py).
        "suggested_by_visitor": bool(spot.suggested_by_visitor),
        "pets_allowed": spot.pets_allowed,
        "reservation_required": spot.reservation_required,
        "cell_signal": spot.cell_signal,
    }
