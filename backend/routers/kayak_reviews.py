from models import KayakReview, KayakDetail
from review_router_factory import build_review_router
from slugs import generate_slug

router = build_review_router(
    prefix="/kayak-reviews",
    tags=["kayak-reviews"],
    review_model=KayakReview,
    fk_field="kayak_details_id",
    parent_model=KayakDetail,
    parent_not_found_detail="Servicio de kayak no encontrado",
    owner_of=lambda kayak: (kayak.owner_email, kayak.name, f"/kayak/{generate_slug(kayak.name)}-{kayak.id}"),
)
