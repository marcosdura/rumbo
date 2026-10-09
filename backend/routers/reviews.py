from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import KayakReview, Review, SpotDB, SurfReview
from slugs import generate_slug
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


# "Mis reseñas": las de lugares, escuelas de surf y servicios de kayak,
# juntas y de la más nueva a la más vieja (antes solo las de lugares: las de
# surf y kayak no se veían en ningún lado del perfil). `kind` dice a qué
# endpoint ir para editarla o borrarla (/reviews, /surf-reviews,
# /kayak-reviews) y `href` lleva a las reseñas de esa página. No colisiona
# con /{parent_id} de arriba (son paths de distinto largo).
def _iso(dt):
    return dt.isoformat() if dt else None


def my_reviews(db: Session, user_id: str) -> list[dict]:
    rows = []
    for r in db.query(Review).filter(Review.user_id == user_id):
        rows.append({
            "kind": "spot", "id": r.id, "target_name": r.spot.name if r.spot else None,
            "href": f"/spots/{r.spot.slug}#reviews" if r.spot and r.spot.slug else None,
            "rating": r.rating, "comment": r.comment, "created_at": r.created_at, "updated_at": r.updated_at,
        })
    for r in db.query(SurfReview).filter(SurfReview.user_id == user_id):
        school = r.surf_school
        rows.append({
            "kind": "surf", "id": r.id, "target_name": school.name if school else None,
            "href": f"/surf/{generate_slug(school.name)}-{school.id}#reviews" if school else None,
            "rating": r.rating, "comment": r.comment, "created_at": r.created_at, "updated_at": r.updated_at,
        })
    for r in db.query(KayakReview).filter(KayakReview.user_id == user_id):
        kayak = r.kayak_detail
        rows.append({
            "kind": "kayak", "id": r.id, "target_name": kayak.name if kayak else None,
            "href": f"/kayak/{generate_slug(kayak.name)}-{kayak.id}#reviews" if kayak else None,
            "rating": r.rating, "comment": r.comment, "created_at": r.created_at, "updated_at": r.updated_at,
        })
    rows.sort(key=lambda row: (row["created_at"] is not None, row["created_at"]), reverse=True)
    return [{**row, "created_at": _iso(row["created_at"]), "updated_at": _iso(row["updated_at"])} for row in rows]


def my_reviews_count(db: Session, user_id: str) -> int:
    return sum(db.query(m).filter(m.user_id == user_id).count() for m in (Review, SurfReview, KayakReview))


@router.get("/user/me")
def get_user_reviews(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    return my_reviews(db, user["sub"])
