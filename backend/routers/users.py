from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import User, Favorite, Review, SurfReview, KayakReview
from database import SessionLocal
from auth import get_current_user
from limiter import limiter

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.delete("/me")
@limiter.limit("5/minute")
async def delete_account(
    request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = user.get("sub")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.query(KayakReview).filter(KayakReview.user_id == user_id).delete()
    db.query(SurfReview).filter(SurfReview.user_id == user_id).delete()
    db.query(Review).filter(Review.user_id == user_id).delete()
    db.query(Favorite).filter(Favorite.user_id == user_id).delete()

    db.delete(db_user)
    db.commit()
    return {"message": "Cuenta eliminada"}
