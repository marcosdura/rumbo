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
    owner_of=lambda spot: (spot.owner_email, spot.name, f"/spots/{spot.slug}#reviews"),
)


# "Mis reseñas", de la más nueva a la más vieja. `kind` queda en "spot" (las
# escuelas de surf y los servicios de kayak son lugares) y `href` lleva a las
# reseñas del lugar. No colisiona con /{parent_id} de arriba (son paths de
# distinto largo).
def _iso(dt):
    return dt.isoformat() if dt else None


def my_reviews(db: Session, user_id: str) -> list[dict]:
    rows = [
        {
            "kind": "spot", "id": r.id, "target_name": r.spot.name if r.spot else None,
            "href": f"/spots/{r.spot.slug}#reviews" if r.spot and r.spot.slug else None,
            "rating": r.rating, "comment": r.comment, "created_at": r.created_at, "updated_at": r.updated_at,
        }
        for r in db.query(Review).filter(Review.user_id == user_id)
    ]
    rows.sort(key=lambda row: (row["created_at"] is not None, row["created_at"]), reverse=True)
    return [{**row, "created_at": _iso(row["created_at"]), "updated_at": _iso(row["updated_at"])} for row in rows]


def my_reviews_count(db: Session, user_id: str) -> int:
    return db.query(Review).filter(Review.user_id == user_id).count()


@router.get("/user/me")
def get_user_reviews(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    return my_reviews(db, user["sub"])
