"""Lo que hace el dueño de un lugar (o el admin, con los mismos permisos):
crearlo, editarlo, sus fotos, sus detalles y su contenido."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_required, is_admin
from ownership import get_owned_spot_or_admin, can_manage_spot, is_admin_managed
from limiter import limiter
from models import SpotDB, SpotAmenity, ClimbingSector, CampingDetail, TrekkingDetail, Route, GlampingDetail, SpotImage, SpotCategory, MotorhomeDetail, GlampingAmenity, Experience
from schemas import SurfDetailIn, KayakServiceDetailIn, ClimbingRouteResponse, SpotEditRequest, SpotCreate, SpotResponse, ClimbingSectorResponse, CampingDetailCreate, TrekkingDetailCreate, RouteResponse, GlampingDetailResponse, SpotCategoryAddRequest, MotorhomeDetailCreate, ExperienceCreate, ExperienceResponse
import models
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from slugs import generate_slug
import contributions
import item_photos as item_photos_domain
import uploads
from notifications import notify_admin
from spot_changes import plan_spot_edit, execute_spot_edit, serialize_request, get_pending_request, request_photos, owner_visible_requests
import cloudinary
import cloudinary.uploader
import os
import re
from spot_payloads import SPOT_DETAIL_OPTIONS, spot_detail


router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Crear un spot
# usa la sesion para hablar con la DB
@router.post("/spots", response_model=SpotResponse)
@limiter.limit("10/minute")
async def create_spot(request: Request, spot: SpotCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):

    category = db.query(models.Category).filter(models.Category.id == spot.category_id).first()

    if not category:
        raise HTTPException(status_code=400, detail="Category not found")

    db_spot = SpotDB(
        name=spot.name,
        description=spot.description,
        department=spot.department,
        category_id=spot.category_id,
        email=spot.email,
        instagram=spot.instagram,
        whatsapp=spot.whatsapp,
        price=spot.price,
        season_start=spot.season_start,
        season_end=spot.season_end,
        owner_email=user.get("email"),
        is_approved=False,
        lat=spot.lat,
        lng=spot.lng,
        slug=generate_slug(spot.name),
        is_public=spot.is_public,
        public_transport=spot.public_transport,
        suggested_by_visitor=not spot.is_responsible,
        suggested_by_email=None if spot.is_responsible else user.get("email"),
        pets_allowed=spot.pets_allowed,
        reservation_required=spot.reservation_required,
        cell_signal=spot.cell_signal,
    )

    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)

    db_spot_category = SpotCategory(
        spot_id=db_spot.id,
        category_id=spot.category_id,
        is_primary=True,
    )
    db.add(db_spot_category)
    if not is_admin(user):
        notify_admin(db, "admin_new_spot", f"Lugar nuevo para revisar: {db_spot.name}", body=user.get("email"))
    db.commit()

    db_spot = (
        db.query(SpotDB)
        .options(joinedload(SpotDB.category))
        .filter(SpotDB.id == db_spot.id)
        .first()
    )
    return db_spot


@router.get("/spots/{spot_id}/preview", response_model=SpotResponse)
def preview_spot(spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Vista previa: la página del lugar aunque todavía no esté publicado (o
    lo hayan despublicado). Solo para el admin y su dueño; antes el "Ver" del
    admin abría la página pública, que daba 404 para un lugar nuevo."""
    full = db.query(SpotDB).options(*SPOT_DETAIL_OPTIONS).filter(SpotDB.id == spot.id).first()
    return spot_detail(db, full)


@router.get("/spots/mine")
def get_my_spots(db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="No autenticado")
    spots = (
        db.query(SpotDB)
        .options(
            joinedload(SpotDB.category),
            joinedload(SpotDB.images),
            joinedload(SpotDB.spot_categories).joinedload(SpotCategory.category),
        )
        .filter(SpotDB.owner_email == email)
        .order_by(SpotDB.created_at.desc())
        .all()
    )
    # Una playa o laguna aprobada (o un lugar que sugirió como visitante) ya
    # no es de quien la sugirió (es del admin): no aparece en "Tus lugares".
    spots = [s for s in spots if is_admin(user) or not (is_admin_managed(s) and s.is_approved)]
    spot_ids = [s.id for s in spots]
    review_aggs = (
        db.query(
            models.Review.spot_id,
            func.avg(models.Review.rating).label("average_rating"),
            func.count(models.Review.id).label("review_count"),
        )
        .filter(models.Review.spot_id.in_(spot_ids))
        .group_by(models.Review.spot_id)
        .all()
    ) if spot_ids else []
    agg_by_id = {r.spot_id: r for r in review_aggs}
    visible = owner_visible_requests(db, spot_ids)
    return [
        {
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "department": s.department,
            "description": s.description,
            "email": s.email,
            "whatsapp": s.whatsapp,
            "instagram": s.instagram,
            "price": s.price,
            "season_start": s.season_start,
            "season_end": s.season_end,
            "is_public": s.is_public,
            "public_transport": s.public_transport,
            "pets_allowed": s.pets_allowed,
            "reservation_required": s.reservation_required,
            "cell_signal": s.cell_signal,
            "is_approved": s.is_approved,
            "rejection_reason": s.rejection_reason,
            "rejected_at": s.rejected_at.isoformat() if s.rejected_at else None,
            "created_at": s.created_at.isoformat(),
            "category": s.category,
            # Todas sus actividades (principal + secundarias): agregar-lugar
            # las usa para ofrecer "tus spots de Surf / Kayak / Trekking".
            "activities": sorted({sc.category.name for sc in s.spot_categories if sc.category} | ({s.category.name} if s.category else set())),
            "images": s.images,
            "average_rating": round(float(agg_by_id[s.id].average_rating), 1) if s.id in agg_by_id and agg_by_id[s.id].average_rating else None,
            "review_count": agg_by_id[s.id].review_count if s.id in agg_by_id else 0,
            # Pedido pendiente, o el último aprobado/rechazado que el dueño
            # todavía no cerró. Lo usan el aviso del dashboard y la etiqueta
            # "cambio en revisión" de /profile.
            "change_request": serialize_request(r) if (r := visible.get(s.id)) else None,
        }
        for s in spots
    ]

@router.post("/spots/{spot_id}/trekking-detail")
@limiter.limit("30/minute")
def add_trekking_detail(request: Request, spot_id: int, data: TrekkingDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    detail = TrekkingDetail(spot_id=spot_id, **data.dict())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


# agrega una amenity al spot
@router.post("/spots/{spot_id}/amenities/{amenity_id}")
@limiter.limit("30/minute")
def add_amenity(request: Request, spot_id: int, amenity_id: int, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):

    amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")

    existing = db.query(SpotAmenity).filter(
        SpotAmenity.spot_id == spot_id,
        SpotAmenity.amenity_id == amenity_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Relation already exists")

    relation = SpotAmenity(
        spot_id=spot_id,
        amenity_id=amenity_id
    )

    db.add(relation)
    db.commit()

    return {"message": "Amenity agregada"}


def _price_from_camping(spot: SpotDB, price):
    """El precio que se lee es el del lugar (spots.price): si el lugar no
    tenía, toma el del camping. camping_details.price queda solo como dato."""
    if spot.price is None and price is not None:
        spot.price = round(price)


@router.post("/spots/{spot_id}/categories")
@limiter.limit("30/minute")
def add_spot_category(request: Request, spot_id: int, data: SpotCategoryAddRequest, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin), user: dict = Depends(get_current_user_required)):
    # Una categoría secundaria hace aparecer el spot en otras búsquedas: sobre
    # un spot aprobado es el mismo "publicar algo y después cambiarlo" que
    # cierran los pedidos de cambio. Agregar lugar la usa solo al crear el
    # spot (todavía no aprobado); después, solo el admin.
    if spot.is_approved and not is_admin(user):
        raise HTTPException(status_code=403, detail="Las categorías de un lugar aprobado solo las cambia el equipo de Rumbo.")
    category = db.query(models.Category).filter(models.Category.name == data.category).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing_relation = db.query(SpotCategory).filter(
        SpotCategory.spot_id == spot_id,
        SpotCategory.category_id == category.id
    ).first()
    if existing_relation and data.category != "Glamping":
        raise HTTPException(status_code=400, detail="Spot already has this category")

    if not existing_relation:
        new_relation = SpotCategory(spot_id=spot_id, category_id=category.id, is_primary=False)
        db.add(new_relation)

    if data.category == "Motorhome" and data.motorhome_detail:
        existing_detail = db.query(MotorhomeDetail).filter(MotorhomeDetail.spot_id == spot_id).first()
        if existing_detail:
            raise HTTPException(status_code=400, detail="Spot already has motorhome details")
        detail = MotorhomeDetail(spot_id=spot_id, **data.motorhome_detail.dict())
        db.add(detail)

    elif data.category == "Camping" and data.camping_detail:
        existing_camping = db.query(CampingDetail).filter(CampingDetail.spot_id == spot_id).first()
        if existing_camping:
            raise HTTPException(status_code=400, detail="Spot already has camping details")
        camping = CampingDetail(spot_id=spot_id, price=data.camping_detail.price)
        db.add(camping)
        _price_from_camping(spot, data.camping_detail.price)

    elif data.category == "Glamping" and data.glamping_detail:
        glamping = GlampingDetail(
            spot_id=spot_id,
            accommodation_type=data.glamping_detail.accommodation_type,
            capacity=data.glamping_detail.capacity,
            price_per_night=data.glamping_detail.price_per_night,
            min_nights=data.glamping_detail.min_nights,
        )
        db.add(glamping)

        if data.glamping_amenities:
            existing_amenities = db.query(GlampingAmenity).filter(GlampingAmenity.spot_id == spot_id).first()
            if not existing_amenities:
                amenity_row = GlampingAmenity(
                    spot_id=spot_id,
                    **data.glamping_amenities.dict(),
                )
                db.add(amenity_row)

    db.commit()

    return {"message": "Category added successfully"}


# agrega detalles del camping
@router.post("/spots/{spot_id}/camping")
@limiter.limit("30/minute")
def add_camping_detail(request: Request, spot_id: int, data: CampingDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    
    camping = CampingDetail(
        spot_id=spot_id,
        price=data.price,
    )

    db.add(camping)
    _price_from_camping(spot, data.price)
    db.commit()
    db.refresh(camping)

    return camping


@router.post("/spots/{spot_id}/motorhome")
@limiter.limit("30/minute")
def add_motorhome_detail(request: Request, spot_id: int, data: MotorhomeDetailCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin)):
    detail = MotorhomeDetail(
        spot_id=spot_id,
        capacity=data.capacity,
        surface_type=data.surface_type,
        has_water=data.has_water,
        has_electricity=data.has_electricity,
        has_dump_station=data.has_dump_station,
        max_stay_nights=data.max_stay_nights,
    )
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


@router.post("/spots/{spot_id}/resubmit")
@limiter.limit("30/minute")
def resubmit_spot(request: Request, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """El dueño corrigió su spot rechazado y lo vuelve a mandar a revisión."""
    if spot.is_approved or spot.rejected_at is None:
        raise HTTPException(status_code=409, detail="Este lugar no está rechazado.")
    spot.rejection_reason = None
    spot.rejected_at = None
    notify_admin(db, "admin_spot_resubmitted", f"Lugar reenviado a revisión: {spot.name}", body=spot.owner_email)
    db.commit()
    return {"id": spot.id}


@router.get("/spots/{spot_id}/can-upload")
@limiter.limit("30/minute")
def can_upload_image(request: Request, spot_id: int, public_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    # El dueño (o el admin) sube fotos del lugar. Y en un lugar publicado con rutas o sectores, cualquier logueado sube
    # fotos de una ruta, sector o vía (item_photos.add_photos valida a cuál).
    # (También con la primera ruta o sector todavía en revisión: agregar lugar
    # sube sus fotos apenas los crea.)
    community_photos = spot.is_approved and (
        db.query(Route).execution_options(include_pending=True).filter(Route.spot_id == spot.id).first() is not None
        or db.query(ClimbingSector).execution_options(include_pending=True).filter(ClimbingSector.spot_id == spot.id).first() is not None
        # La foto de su reseña (item_photos valida que sea suya).
        or db.query(models.Review).filter(models.Review.spot_id == spot.id, models.Review.user_id == user.get("sub")).first() is not None
    )
    if not can_manage_spot(spot, user) and not community_photos:
        raise HTTPException(status_code=403, detail="No autorizado")
    #
    # El formato es el que arma lib/uploadImage.ts: "{spot_id}/{16 hex}".
    # Exigirlo acá ata cada foto nueva a su spot y deja afuera cualquier id
    # elegido a mano (antes los ids eran "Categoria/Nombre/NombreN",
    # adivinables y apuntables).
    if not re.fullmatch(rf"{spot.id}/[0-9a-f]{{16}}", public_id):
        raise HTTPException(status_code=400, detail="public_id con formato inválido")
    # Ningún spot (tampoco este) puede reusar un id existente: antes solo se
    # miraba OTROS spots, y el dueño podía pisar en Cloudinary una foto propia
    # ya aprobada. La firma ahora lleva overwrite=false, que es la protección
    # real; esto lo corta antes. Se compara también con el prefijo de la
    # carpeta porque Cloudinary puede guardarlo como "rumbo/spots/{id}".
    existing = db.query(SpotImage).filter(
        SpotImage.cloudinary_public_id.in_([public_id, f"rumbo/spots/{public_id}"])
    ).first()
    if existing or item_photos_domain.is_public_id_used(db, f"rumbo/spots/{public_id}"):
        raise HTTPException(status_code=409, detail="Ese public_id ya está en uso")
    # Las fotos de un pedido pendiente todavía no tienen fila en spot_images.
    pending = get_pending_request(db, spot.id)
    if pending and {public_id, f"rumbo/spots/{public_id}"} & set(request_photos(pending)):
        raise HTTPException(status_code=409, detail="Ese public_id ya está en uso")
    # Tope por usuario y registro para borrar después lo que no se use.
    uploads.issue_ticket(db, spot.id, public_id, user)
    return {"ok": True}


@router.patch("/admin/spots/{spot_id}")
@limiter.limit("20/minute")
def edit_spot_admin(
    request: Request,
    body: SpotEditRequest,
    dry_run: bool = False,
    spot: SpotDB = Depends(get_owned_spot_or_admin),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    # Lo usan el dueño (dashboard) y el admin (EditSpotModal). Sobre un spot
    # aprobado, el dueño ya no escribe directo los campos sensibles: van a un
    # pedido de cambio (ver spot_changes.py). dry_run=true devuelve la misma
    # clasificación sin escribir nada — el dashboard la usa para avisar qué va
    # a revisión antes de subir fotos y guardar.
    admin = is_admin(user)
    plan = plan_spot_edit(db, spot, body.model_dump(exclude_unset=True), admin=admin)
    applied = list(plan["apply"].keys()) + (["photos_added"] if plan["photos_direct"] else [])
    pending = list(plan["pending"].keys()) + (["photos_added"] if plan["photos_added"] else [])
    if dry_run:
        return {"id": spot.id, "applied": applied, "pending": pending}

    change_request = execute_spot_edit(db, spot, plan, requested_by=user.get("email"))
    db.refresh(spot)
    return {
        "id": spot.id,
        "name": spot.name,
        "applied": applied,
        "pending": pending,
        "change_request": serialize_request(change_request) if change_request else None,
    }


@router.patch("/admin/spots/{spot_id}/main-image")
@limiter.limit("30/minute")
def set_main_image(request: Request, data: dict, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    public_id = data.get("cloudinary_public_id")
    images = db.query(SpotImage).filter(SpotImage.spot_id == spot.id).all()
    for img in images:
        img.is_main = (img.cloudinary_public_id == public_id)
    db.commit()
    return {"ok": True}


@router.delete("/admin/images/{public_id:path}")
@limiter.limit("30/minute")
def delete_image(request: Request, public_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    img = db.query(SpotImage).filter(SpotImage.cloudinary_public_id == public_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    spot = db.query(SpotDB).filter(SpotDB.id == img.spot_id).first()
    if not is_admin(user) and (not spot or spot.owner_email != user.get("email")):
        raise HTTPException(status_code=403, detail="No autorizado")

    db.delete(img)
    db.commit()

    # Borrar la fila sin destruir el archivo dejaba la foto viva en Cloudinary
    # para siempre: ocupando cuota y, peor, servida públicamente por su URL a
    # cualquiera que la tuviera. delete_spot ya hacía esto bien; este camino
    # (borrar una foto suelta desde el panel admin o el dashboard del dueño)
    # se lo había salteado.
    #
    # Va después del commit y no antes, al revés que en delete_spot: si el
    # destroy falla, preferimos un huérfano en Cloudinary (invisible, queda
    # logueado) antes que una fila apuntando a un archivo que ya no existe,
    # que sería una imagen rota en la página pública del spot.
    try:
        result = cloudinary.uploader.destroy(public_id)
        print(f"[Cloudinary] Destruyendo {public_id}: {result}")
    except Exception as e:
        print(f"[Cloudinary] No se pudo destruir {public_id}: {e}")

    return {"ok": True}


@router.post("/spots/{spot_id}/experiences", response_model=ExperienceResponse)
@limiter.limit("30/minute")
def create_experience(request: Request, spot_id: int, data: ExperienceCreate, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin), user: dict = Depends(get_current_user_required)):
    category = db.query(models.Category).filter(models.Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    pending = contributions.decide(spot, "experience", user)
    experience = Experience(spot_id=spot_id, **data.dict())
    db.add(experience)
    db.flush()
    contributions.register(db, "experience", experience, spot, user, pending)

    # La categoría de la experiencia se suma al spot (aparece en esas
    # búsquedas). Si la experiencia queda en revisión, eso se hace al aprobarla.
    existing_sc = db.query(SpotCategory).filter(
        SpotCategory.spot_id == spot_id,
        SpotCategory.category_id == data.category_id,
    ).first()
    if not existing_sc and not pending:
        db.add(SpotCategory(spot_id=spot_id, category_id=data.category_id, is_primary=False))

    db.commit()
    db.refresh(experience)
    experience.category
    return experience


@router.get("/spots/{spot_id}/owner-content")
def get_owner_content(spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Para el dashboard del dueño: todo lo que tiene su lugar (experiencias,
    glamping, rutas, sectores con sus vías, surf, kayak), incluido lo que está
    en revisión (is_approved = False), que la lectura pública oculta. Lo
    rechazado ya no existe: su resultado se ve en /profile ("Tus aportes")."""
    def every(model):
        return db.query(model).execution_options(include_pending=True)

    experiences = (
        db.query(Experience)
        .execution_options(include_pending=True)
        .options(selectinload(Experience.category))
        .filter(Experience.spot_id == spot.id)
        .order_by(Experience.id)
        .all()
    )
    glamping_units = (
        db.query(GlampingDetail)
        .execution_options(include_pending=True)
        .filter(GlampingDetail.spot_id == spot.id)
        .order_by(GlampingDetail.id)
        .all()
    )
    routes = every(Route).filter(Route.spot_id == spot.id).order_by(Route.id).all()
    sectors = every(ClimbingSector).filter(ClimbingSector.spot_id == spot.id).order_by(ClimbingSector.id).all()

    def dump(schema, obj):
        return schema.model_validate(obj).model_dump(mode="json")

    # Fotos y recorridos (también los en revisión, de cualquiera): el dueño
    # los ve y puede sacarlos (item_photos.owner_remove, route_tracks.owner_remove).
    import route_tracks
    route_photos = item_photos_domain.owner_view(db, "trekking_route", [r.id for r in routes])
    sector_photos = item_photos_domain.owner_view(db, "climbing_sector", [s.id for s in sectors])
    via_photos = item_photos_domain.owner_view(db, "climbing_route", [v.id for s in sectors for v in s.routes])
    return {
        "experiences": [dump(ExperienceResponse, e) for e in experiences],
        "glamping_units": [dump(GlampingDetailResponse, g) for g in glamping_units],
        "routes": [
            {**dump(RouteResponse, r), "photos": route_photos[r.id], "track": route_tracks.owner_summary(db, r.id)}
            for r in routes
        ],
        # sector.routes: carga de relación desde una consulta con
        # include_pending, así que trae también las vías en revisión.
        "sectors": [
            {
                **dump(ClimbingSectorResponse, s), "photos": sector_photos[s.id],
                "routes": [{**dump(ClimbingRouteResponse, r), "photos": via_photos[r.id]} for r in sorted(s.routes, key=lambda r: r.id)],
            }
            for s in sectors
        ],
        # Para editarlos desde el panel (routers/owner_edits.py).
        "trekking_detail": TrekkingDetailCreate.model_validate(spot.trekking_detail).model_dump() if spot.trekking_detail else None,
        "surf_detail": dump(SurfDetailIn, spot.surf_detail) if spot.surf_detail else None,
        "kayak_service_detail": dump(KayakServiceDetailIn, spot.kayak_service_detail) if spot.kayak_service_detail else None,
        "motorhome_detail": (
            MotorhomeDetailCreate.model_validate(spot.motorhome_detail, from_attributes=True).model_dump()
            if spot.motorhome_detail else None
        ),
        "amenity_ids": sorted(sa.amenity_id for sa in spot.amenities),
    }


@router.delete("/spots/{spot_id}/experiences/{experience_id}")
@limiter.limit("30/minute")
def delete_experience(request: Request, spot_id: int, experience_id: int, db: Session = Depends(get_db), spot: SpotDB = Depends(get_owned_spot_or_admin), user: dict = Depends(get_current_user_required)):
    # include_pending: el dueño también puede borrar una experiencia en revisión.
    experience = db.query(Experience).execution_options(include_pending=True).filter(
        Experience.id == experience_id,
        Experience.spot_id == spot_id,
    ).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    category_id = experience.category_id
    contributions.withdraw_for_deleted_item(db, "experience", experience.id, by=user.get("email"))
    db.delete(experience)
    db.flush()

    # Solo cuentan las aprobadas: una pendiente todavía no sumó la categoría.
    remaining = db.query(Experience).filter(
        Experience.spot_id == spot_id,
        Experience.category_id == category_id,
        Experience.is_approved == True,
    ).count()

    if remaining == 0:
        db.query(SpotCategory).filter(
            SpotCategory.spot_id == spot_id,
            SpotCategory.category_id == category_id,
        ).delete()

    db.commit()
    return {"message": "Experience deleted"}
