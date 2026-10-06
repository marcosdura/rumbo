from models import SurfReview, SurfSchool
from review_router_factory import build_review_router
from slugs import generate_slug

router = build_review_router(
    prefix="/surf-reviews",
    tags=["surf-reviews"],
    review_model=SurfReview,
    fk_field="surf_beach_id",
    parent_model=SurfSchool,
    parent_not_found_detail="Escuela de surf no encontrada",
    owner_of=lambda school: (school.owner_email, school.name, f"/surf/{generate_slug(school.name)}-{school.id}"),
)
