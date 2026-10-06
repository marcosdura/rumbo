from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required
from models import SpotDB
from ownership import assert_owns_spot, is_public_venue
from limiter import limiter
import contributions
from operators import PHOTO_FIELDS, assert_can_manage_operator, assert_valid_photos, cancel_pending_change


def build_operator_router(*, prefix, tags, model, kind, create_schema, response_schema, not_found_detail):
    """kayak.py y surfschools.py eran el mismo router con los nombres
    cambiados — alta, /ids para el sitemap, listado, detalle y borrado.
    Arma ese router una sola vez, parametrizado por modelo/schema.

    Reglas (operators.py): en una playa o laguna cualquier usuario logueado
    suma su escuela (con revisión) y pasa a ser su dueño; la maneja su dueño
    o el admin. En otro tipo de lugar sigue la regla vieja: el dueño del lugar.
    """
    router = APIRouter(prefix=prefix, tags=tags)

    def public(query):
        # Una escuela aprobada en una playa todavía en revisión (o
        # desactivada) no se ve: la playa tiene que estar publicada.
        return query.join(SpotDB, SpotDB.id == model.spot_id).filter(
            SpotDB.is_approved == True, SpotDB.owner_deleted_at.is_(None)
        )

    @router.post("/", response_model=response_schema)
    @limiter.limit("10/minute")
    async def create(
        request: Request,
        data: create_schema,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user_required),
    ):
        spot = db.query(SpotDB).filter(SpotDB.id == data.spot_id).first()
        if not spot:
            raise HTTPException(status_code=404, detail="Spot not found")
        if not is_public_venue(spot):
            assert_owns_spot(db, spot.id, user)
        assert_valid_photos(spot.id, [getattr(data, f) for f in PHOTO_FIELDS])
        pending = contributions.decide(spot, kind, user)
        db_obj = model(**data.dict(), owner_email=user.get("email"))
        db.add(db_obj)
        db.flush()
        contributions.register(db, kind, db_obj, spot, user, pending)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    # /ids antes de /{item_id}: FastAPI matchea rutas en orden de
    # registro, así que si "ids" pudiera colar como valor de item_id
    # (int) esto evita el 422 — mismo orden que tenían los 2 originales.
    @router.get("/ids")
    def get_ids(db: Session = Depends(get_db)):
        rows = public(db.query(model.id, model.name)).all()
        return [{"id": r.id, "name": r.name} for r in rows]

    @router.get("/", response_model=list[response_schema])
    def get_list(db: Session = Depends(get_db)):
        return public(db.query(model)).all()

    @router.get("/{item_id}", response_model=response_schema)
    def get_detail(item_id: int, db: Session = Depends(get_db)):
        obj = public(db.query(model)).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=not_found_detail)
        return obj

    @router.delete("/{item_id}")
    @limiter.limit("20/minute")
    def delete(request: Request, item_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
        obj = db.query(model).execution_options(include_pending=True).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=not_found_detail)
        assert_can_manage_operator(obj, obj.spot, user)
        # Su pedido de cambio pendiente se cancela (y sus fotos nuevas se van).
        photos = cancel_pending_change(db, kind, obj.id, by=user.get("email"))
        photos += contributions.delete_item(db, kind, obj, by=user.get("email"))
        db.commit()
        # Fotos después del commit, como en el resto de los borrados.
        contributions.destroy_cloudinary_images(photos)
        return {"ok": True}

    return router
