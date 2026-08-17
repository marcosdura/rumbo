from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter


def build_operator_router(*, prefix, tags, model, create_schema, response_schema, not_found_detail):
    """kayak.py y surfschools.py eran el mismo router con los nombres
    cambiados — alta con chequeo de ownership, /ids para el sitemap,
    listado y detalle. Arma ese router una sola vez, parametrizado por
    modelo/schema. A diferencia de review_router_factory, acá el alta SÍ
    valida ownership (assert_owns_spot) y no hay endpoint de borrado en
    ninguno de los dos originales, así que no se inventa uno acá.
    """
    router = APIRouter(prefix=prefix, tags=tags)

    @router.post("/", response_model=response_schema)
    @limiter.limit("10/minute")
    async def create(
        request: Request,
        data: create_schema,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user_required),
    ):
        assert_owns_spot(db, data.spot_id, user)
        db_obj = model(**data.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    # /ids antes de /{item_id}: FastAPI matchea rutas en orden de
    # registro, así que si "ids" pudiera colar como valor de item_id
    # (int) esto evita el 422 — mismo orden que tenían los 2 originales.
    @router.get("/ids")
    def get_ids(db: Session = Depends(get_db)):
        rows = db.query(model.id, model.name).all()
        return [{"id": r.id, "name": r.name} for r in rows]

    @router.get("/", response_model=list[response_schema])
    def get_list(db: Session = Depends(get_db)):
        return db.query(model).all()

    @router.get("/{item_id}", response_model=response_schema)
    def get_detail(item_id: int, db: Session = Depends(get_db)):
        obj = db.query(model).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=not_found_detail)
        return obj

    return router
