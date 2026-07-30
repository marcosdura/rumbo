from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Review, SpotDB, User
from schemas import ReviewCreate, ReviewResponse
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


@router.get("/{spot_id}/summary")
def get_reviews_summary(spot_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(Review.rating).label("average"),
            func.count(Review.id).label("total"),
        )
        .filter(Review.spot_id == spot_id)
        .first()
    )
    return {
        "average": round(float(result.average), 1) if result.average else None,
        "total": result.total,
    }


@router.get("/{spot_id}", response_model=list[ReviewResponse])
def get_reviews(spot_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.spot_id == spot_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED, response_model=ReviewResponse)
@limiter.limit("10/minute")
async def create_review(request: Request, spot_id: int, data: ReviewCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    user_id = user["sub"]

    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")

    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    review = Review(
        spot_id=spot_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}")
@limiter.limit("10/minute")
async def delete_review(request: Request, review_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    user_id = user["sub"]
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="No podés borrar esta review")

    db.delete(review)
    db.commit()
    return {"message": "Review eliminada"}