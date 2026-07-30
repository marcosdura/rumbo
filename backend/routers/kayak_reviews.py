from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import KayakReview, KayakDetail, User
from schemas import ReviewCreate, KayakReviewResponse
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/kayak-reviews", tags=["kayak-reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{kayak_details_id}/summary")
def get_kayak_reviews_summary(kayak_details_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(KayakReview.rating).label("average"),
            func.count(KayakReview.id).label("total"),
        )
        .filter(KayakReview.kayak_details_id == kayak_details_id)
        .first()
    )
    return {
        "average": round(float(result.average), 1) if result.average else None,
        "total": result.total,
    }


@router.get("/{kayak_details_id}", response_model=list[KayakReviewResponse])
def get_kayak_reviews(kayak_details_id: int, db: Session = Depends(get_db)):
    return (
        db.query(KayakReview)
        .filter(KayakReview.kayak_details_id == kayak_details_id)
        .order_by(KayakReview.created_at.desc())
        .all()
    )


@router.post("/{kayak_details_id}", status_code=status.HTTP_201_CREATED, response_model=KayakReviewResponse)
@limiter.limit("10/minute")
async def create_kayak_review(
    request: Request,
    kayak_details_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    user_id = user["sub"]

    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")

    if not db.query(KayakDetail).filter(KayakDetail.id == kayak_details_id).first():
        raise HTTPException(status_code=404, detail="Servicio de kayak no encontrado")

    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    review = KayakReview(
        kayak_details_id=kayak_details_id,
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
async def delete_kayak_review(
    request: Request,
    review_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    user_id = user["sub"]
    review = db.query(KayakReview).filter(KayakReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="No podés borrar esta review")

    db.delete(review)
    db.commit()
    return {"message": "Review eliminada"}
