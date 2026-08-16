from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models import User, Favorite, Review, SurfReview, KayakReview, SpotDB
from database import get_db
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/users", tags=["users"])



@router.get("/me")
async def get_me(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    db_user = db.query(User).filter(User.id == user.get("sub")).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": db_user.id}


@router.delete("/me")
@limiter.limit("5/minute")
async def delete_account(
    request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    user_id = user.get("sub")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.query(KayakReview).filter(KayakReview.user_id == user_id).delete()
    db.query(SurfReview).filter(SurfReview.user_id == user_id).delete()
    db.query(Review).filter(Review.user_id == user_id).delete()
    db.query(Favorite).filter(Favorite.user_id == user_id).delete()

    # Los spots no se borran: se desactivan (dejan de mostrarse públicamente)
    # y quedan a la vista del admin en /admin bajo "Cuentas eliminadas" para
    # poder contactar al dueño antes de decidir qué hacer con ellos.
    db.query(SpotDB).filter(
        SpotDB.owner_email == db_user.email,
        SpotDB.owner_deleted_at.is_(None),
    ).update({"owner_deleted_at": func.now()}, synchronize_session=False)

    db.delete(db_user)
    db.commit()
    return {"message": "Cuenta eliminada"}
