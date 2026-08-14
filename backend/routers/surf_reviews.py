from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import SurfReview, SurfSchool, User
from schemas import ReviewCreate, SurfReviewResponse
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/surf-reviews", tags=["surf-reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{surf_beach_id}/summary")
def get_surf_reviews_summary(surf_beach_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(SurfReview.rating).label("average"),
            func.count(SurfReview.id).label("total"),
        )
        .filter(SurfReview.surf_beach_id == surf_beach_id)
        .first()
    )
    return {
        "average": round(float(result.average), 1) if result.average else None,
        "total": result.total,
    }


@router.get("/{surf_beach_id}", response_model=list[SurfReviewResponse])
def get_surf_reviews(
    surf_beach_id: int,
    response: Response,
    db: Session = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    base = db.query(SurfReview).filter(SurfReview.surf_beach_id == surf_beach_id)
    response.headers["X-Total-Count"] = str(base.count())
    return base.order_by(SurfReview.created_at.desc()).limit(limit).offset(offset).all()


@router.post("/{surf_beach_id}", status_code=status.HTTP_201_CREATED, response_model=SurfReviewResponse)
@limiter.limit("10/minute")
async def create_surf_review(
    request: Request,
    surf_beach_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    user_id = user["sub"]

    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")

    if not db.query(SurfSchool).filter(SurfSchool.id == surf_beach_id).first():
        raise HTTPException(status_code=404, detail="Escuela de surf no encontrada")

    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    review = SurfReview(
        surf_beach_id=surf_beach_id,
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
async def delete_surf_review(
    request: Request,
    review_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    user_id = user["sub"]
    review = db.query(SurfReview).filter(SurfReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="No podés borrar esta review")

    db.delete(review)
    db.commit()
    return {"message": "Review eliminada"}
