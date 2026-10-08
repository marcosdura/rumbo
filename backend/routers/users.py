from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models import User, Favorite, Review, SurfReview, KayakReview, SpotDB, SpotChangeRequest
from database import get_db
from auth import get_current_user_required
from limiter import limiter
from spot_changes import close_request, request_photos, destroy_cloudinary_images
import contributions
import operators
from models import OperatorChangeRequest

router = APIRouter(prefix="/users", tags=["users"])



@router.get("/me")
async def get_me(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    db_user = db.query(User).filter(User.id == user.get("sub")).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # created_at: "Miembro desde" en /profile.
    return {"id": db_user.id, "created_at": db_user.created_at.isoformat() if db_user.created_at else None}


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

    # Los pedidos de cambio pendientes se cancelan: el spot queda desactivado
    # y no hay dueño que vaya a ver el resultado. Sus fotos nuevas nunca se
    # publicaron, así que se destruyen en Cloudinary.
    pending = (
        db.query(SpotChangeRequest)
        .join(SpotDB, SpotDB.id == SpotChangeRequest.spot_id)
        .filter(SpotDB.owner_email == db_user.email, SpotChangeRequest.status == "pending")
        .all()
    )
    orphan_photos = []
    for change in pending:
        orphan_photos += request_photos(change)
        close_request(change, "cancelled", by=db_user.email)
    # Sus aportes pendientes (también sectores sugeridos en spots ajenos) se
    # retiran: nadie va a ver el resultado.
    orphan_photos += contributions.withdraw_all_by_author(db, db_user.email)
    # Y los pedidos de cambio pendientes de sus escuelas de surf / kayak.
    for change in db.query(OperatorChangeRequest).filter_by(requested_by=db_user.email, status="pending"):
        orphan_photos += operators.discard_change(change, "cancelled", by=db_user.email)

    db.delete(db_user)
    db.commit()
    destroy_cloudinary_images(orphan_photos)
    return {"message": "Cuenta eliminada"}
