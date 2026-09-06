from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
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
    def get_summary(
        parent_id: int,
        db: Session = Depends(get_db),
        user: Optional[dict] = Depends(get_current_user),
    ):
        result = (
            db.query(
                func.avg(review_model.rating).label("average"),
                func.count(review_model.id).label("total"),
            )
            .filter(fk_column == parent_id)
            .first()
        )

        # La reseña propia viaja acá y no en el listado porque el listado está
        # paginado de a 10: si la propia cayó en la página 3, el frontend no
        # tendría forma de saber que ya reseñó y le ofrecería escribir otra,
        # que ahora la constraint rechaza.
        my_review = None
        if user:
            mine = (
                db.query(review_model)
                .filter(fk_column == parent_id, review_model.user_id == user["sub"])
                .first()
            )
            if mine:
                my_review = {
                    "id": mine.id,
                    "rating": mine.rating,
                    "comment": mine.comment,
                }

        return {
            "average": round(float(result.average), 1) if result.average else None,
            "total": result.total,
            "my_review": my_review,
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
        try:
            db.commit()
        except IntegrityError:
            # Choca con la constraint de una reseña por usuario y por lugar.
            # El frontend no debería llegar acá (el summary le dice si ya tiene
            # una y le ofrece editarla), así que esto cubre el caso de dos
            # pestañas abiertas o de alguien pegándole a la API directo.
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Ya dejaste una reseña acá. Podés editarla.",
            )
        db.refresh(review)
        return review

    @router.patch("/{review_id}", response_model=ReviewResponse)
    @limiter.limit("10/minute")
    async def update(
        request: Request,
        review_id: int,
        data: ReviewCreate,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user_required),
    ):
        user_id = user["sub"]

        if not 1 <= data.rating <= 5:
            raise HTTPException(status_code=400, detail="El rating debe ser entre 1 y 5")

        review = db.query(review_model).filter(review_model.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review no encontrada")
        # Solo el autor, sin bypass de admin a propósito: que un admin pueda
        # borrar una reseña abusiva es moderación, pero que reescriba las
        # palabras de otro y las deje publicadas a su nombre, no.
        if review.user_id != user_id:
            raise HTTPException(status_code=403, detail="No podés editar esta review")

        review.rating = data.rating
        review.comment = data.comment
        review.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(review)
        review.is_mine = True
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
