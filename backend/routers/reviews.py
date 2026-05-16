from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Review, SpotDB, User
from schemas import ReviewCreate, ReviewResponse
 
router = APIRouter(prefix="/reviews", tags=["reviews"])
 
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 

@router.get("/user/{user_id}")
def get_user_reviews(user_id: str, db: Session = Depends(get_db)):
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
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]
 
# Retorna el rating promedio y cantidad de reviews de un spot
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

# Retorna todas las reviews de un spot, con info del usuario
@router.get("/{spot_id}", response_model=list[ReviewResponse])
def get_reviews(spot_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.spot_id == spot_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews
 
 
# Crea una review para un spot
@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED, response_model=ReviewResponse)
def create_review(spot_id: int, data: ReviewCreate, db: Session = Depends(get_db)):
    # Validar rating
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")
 
    # Verificar que el spot existe
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot no encontrado")
 
    # Verificar que el usuario existe
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
 
    review = Review(
        spot_id=spot_id,
        user_id=data.user_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
 
 
# Borra una review (solo el creador)
@router.delete("/{review_id}")
def delete_review(review_id: int, user_id: str, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="No podés borrar esta review")
 
    db.delete(review)
    db.commit()
    return {"message": "Review eliminada"}
 