from models import SurfReview, SurfSchool
from review_router_factory import build_review_router

router = build_review_router(
    prefix="/surf-reviews",
    tags=["surf-reviews"],
    review_model=SurfReview,
    fk_field="surf_beach_id",
    parent_model=SurfSchool,
    parent_not_found_detail="Escuela de surf no encontrada",
)
