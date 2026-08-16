from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Review, SpotDB
from auth import get_current_user_required
from review_router_factory import build_review_router

router = build_review_router(
    prefix="/reviews",
    tags=["reviews"],
    review_model=Review,
    fk_field="spot_id",
    parent_model=SpotDB,
    parent_not_found_detail="Spot no encontrado",
)


# Único endpoint que no generaliza a kayak/surf — "mis reviews" con el
# nombre/slug del spot ya resueltos. No colisiona con /{parent_id} de
# arriba (son paths de distinto largo), así que el orden no importa.
@router.get("/user/me")
def get_user_reviews(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    user_id = user["sub"]
    reviews = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "spot_id": r.spot_id,
            "spot_name": r.spot.name,
            "spot_slug": r.spot.slug,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]
