from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User
from schemas import ReviewCreate, ReviewResponse
from auth import get_current_user_required, get_current_user
from limiter import limiter


def build_review_router(*, prefix, tags, review_model, fk_field, parent_model, parent_not_found_detail):
    """reviews.py, kayak_reviews.py y surf_reviews.py eran 3 copias casi
    idénticas de este mismo CRUD (summary, listado paginado, alta, baja) —
    cambiaba solo el modelo de review, el FK al padre y el mensaje de
    "no encontrado". Esta función arma ese router una sola vez, parametrizado.
    """
    router = APIRouter(prefix=prefix, tags=tags)
    fk_column = getattr(review_model, fk_field)

    @router.get("/{parent_id}/summary")
    def get_summary(parent_id: int, db: Session = Depends(get_db)):
        result = (
            db.query(
                func.avg(review_model.rating).label("average"),
                func.count(review_model.id).label("total"),
            )
            .filter(fk_column == parent_id)
            .first()
        )
        return {
            "average": round(float(result.average), 1) if result.average else None,
            "total": result.total,
        }

    @router.get("/{parent_id}", response_model=list[ReviewResponse])
    def get_list(
        parent_id: int,
        response: Response,
        db: Session = Depends(get_db),
        limit: int = Query(default=10, ge=1, le=50),
        offset: int = Query(default=0, ge=0),
        user: Optional[dict] = Depends(get_current_user),
    ):
        base = db.query(review_model).filter(fk_column == parent_id)
        response.headers["X-Total-Count"] = str(base.count())
        reviews = base.order_by(review_model.created_at.desc()).limit(limit).offset(offset).all()
        # Auth opcional (get_current_user, no get_current_user_required): el
        # listado sigue siendo público sin token. Con token, marca cuáles son
        # del que pregunta — reemplaza exponer el sub de Google de cada autor
        # en el JSON, que es lo único para lo que el frontend lo usaba.
        current_sub = user["sub"] if user else None
        for r in reviews:
            r.is_mine = (r.user_id == current_sub)
        return reviews

    @router.post("/{parent_id}", status_code=status.HTTP_201_CREATED, response_model=ReviewResponse)
    @limiter.limit("10/minute")
    async def create(
        request: Request,
        parent_id: int,
        data: ReviewCreate,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user_required),
    ):
        user_id = user["sub"]

        if not 1 <= data.rating <= 5:
            raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")

        if not db.query(parent_model).filter(parent_model.id == parent_id).first():
            raise HTTPException(status_code=404, detail=parent_not_found_detail)

        if not db.query(User).filter(User.id == user_id).first():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        review = review_model(
            **{fk_field: parent_id},
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
    async def delete(
        request: Request,
        review_id: int,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user_required),
    ):
        user_id = user["sub"]
        review = db.query(review_model).filter(review_model.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review no encontrada")
        if review.user_id != user_id:
            raise HTTPException(status_code=403, detail="No podés borrar esta review")

        db.delete(review)
        db.commit()
        return {"message": "Review eliminada"}

    return router
