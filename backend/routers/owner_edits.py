"""Lo que el dueño de un lugar (o el admin) corrige desde su panel, después
de crearlo: rutas de trekking, experiencias, alojamientos de glamping, las
características del trekking y los servicios del camping y del motorhome.

Antes solo se podían sumar o borrar: para corregir la distancia de una ruta
había que borrarla y volver a crearla (y ahora perdía sus fotos y su
recorrido). Se aplica al instante, también sobre algo ya publicado: es
contenido del dueño en su propio lugar. Solo se toca lo que viene."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user_required
from limiter import limiter
from models import Amenity, Experience, GlampingDetail, KayakServiceDetail, MotorhomeDetail, Route, SpotAmenity, SpotDB, SurfDetail, TrekkingDetail
from ownership import assert_owns_spot, get_owned_spot_or_admin
from schemas import (
    ExperienceResponse, GlampingDetailCreate, GlampingDetailResponse, MotorhomeDetailCreate,
    MotorhomeDetailResponse, RouteResponse, TrekkingDetailCreate, SurfDetailIn, KayakServiceDetailIn,
)

router = APIRouter(tags=["owner-edits"])


def _apply(obj, data: dict):
    for field, value in data.items():
        setattr(obj, field, value)


def _pending_ok(db: Session, model, item_id: int):
    """Incluye lo que está en revisión: el dueño también lo corrige."""
    item = db.query(model).execution_options(include_pending=True).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item


def _clean_name(data: dict, field: str):
    if field in data:
        value = (data[field] or "").strip()
        if not value:
            raise HTTPException(status_code=422, detail="El nombre no puede quedar vacío.")
        data[field] = value


# -------- Rutas de trekking --------

class RouteEdit(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    distance_km: Optional[float] = Field(default=None, ge=0)
    duration_hours: Optional[float] = Field(default=None, ge=0)
    elevation_gain: Optional[int] = Field(default=None, ge=0)
    elevation_loss: Optional[int] = Field(default=None, ge=0)
    max_altitude: Optional[int] = None
    min_altitude: Optional[int] = None
    difficulty: Optional[str] = Field(default=None, max_length=50)
    route_type: Optional[str] = Field(default=None, max_length=50)
    technical_level: Optional[str] = Field(default=None, max_length=50)
    physical_demand: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=2000)


@router.patch("/routes/{route_id}", response_model=RouteResponse)
@limiter.limit("30/minute")
def edit_route(request: Request, route_id: int, body: RouteEdit, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    """El slug no cambia aunque cambie el nombre: los links compartidos
    siguen andando."""
    route = _pending_ok(db, Route, route_id)
    assert_owns_spot(db, route.spot_id, user)
    data = body.model_dump(exclude_unset=True)
    _clean_name(data, "name")
    if "description" in data:
        data["description"] = (data["description"] or "").strip() or None
    _apply(route, data)
    db.commit()
    db.refresh(route)
    return route


# -------- Experiencias --------

class ExperienceEdit(BaseModel):
    # La categoría no: sumar una experiencia suma su categoría al lugar.
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, max_length=3)
    schedule: Optional[str] = Field(default=None, max_length=300)
    contact: Optional[str] = Field(default=None, max_length=300)


@router.patch("/spots/{spot_id}/experiences/{experience_id}", response_model=ExperienceResponse)
@limiter.limit("30/minute")
def edit_experience(request: Request, experience_id: int, body: ExperienceEdit, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    experience = _pending_ok(db, Experience, experience_id)
    if experience.spot_id != spot.id:
        raise HTTPException(status_code=404, detail="No encontrado")
    data = body.model_dump(exclude_unset=True)
    _clean_name(data, "title")
    if data.get("currency") is None:
        data.pop("currency", None)
    _apply(experience, data)
    db.commit()
    db.refresh(experience)
    return experience


# -------- Alojamientos de glamping --------

@router.patch("/glamping/units/{unit_id}", response_model=GlampingDetailResponse)
@limiter.limit("30/minute")
def edit_glamping_unit(request: Request, unit_id: int, body: GlampingDetailCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    unit = _pending_ok(db, GlampingDetail, unit_id)
    assert_owns_spot(db, unit.spot_id, user)
    _apply(unit, body.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(unit)
    return unit


# -------- Características y servicios del lugar --------

@router.put("/spots/{spot_id}/trekking-detail")
def set_trekking_detail(body: TrekkingDetailCreate, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Las características de un trekking (baños, agua, fogones...).
    null = no sé."""
    detail = spot.trekking_detail or TrekkingDetail(spot_id=spot.id)
    _apply(detail, body.model_dump(exclude_unset=True))
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return TrekkingDetailCreate.model_validate(detail)


@router.put("/spots/{spot_id}/motorhome-detail", response_model=MotorhomeDetailResponse)
def set_motorhome_detail(body: MotorhomeDetailCreate, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    detail = db.query(MotorhomeDetail).filter(MotorhomeDetail.spot_id == spot.id).first() or MotorhomeDetail(spot_id=spot.id)
    _apply(detail, body.model_dump(exclude_unset=True))
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


# Escuela de surf / servicio de kayak: lo propio del lugar, al instante
# (como el resto de los datos prácticos). Se crea si no estaba.
def _set_detail(db: Session, spot: SpotDB, model, schema, body: BaseModel, category: str):
    if category not in {c.category.name for c in spot.spot_categories} | ({spot.category.name} if spot.category else set()):
        raise HTTPException(status_code=422, detail=f"Este lugar no es de {category}.")
    detail = db.query(model).filter(model.spot_id == spot.id).first() or model(spot_id=spot.id)
    data = body.model_dump(exclude_unset=True)
    if "operates_at" in data and data["operates_at"] is not None:
        data["operates_at"] = " ".join(data["operates_at"].split()) or None
    _apply(detail, data)
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return schema.model_validate(detail)


@router.put("/spots/{spot_id}/surf-detail", response_model=SurfDetailIn)
def set_surf_detail(body: SurfDetailIn, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Lo propio de una escuela de surf (clases, niveles, idiomas, dónde opera)."""
    return _set_detail(db, spot, SurfDetail, SurfDetailIn, body, "Surf")


@router.put("/spots/{spot_id}/kayak-detail", response_model=KayakServiceDetailIn)
def set_kayak_detail(body: KayakServiceDetailIn, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Lo propio de un servicio de kayak (agua, dificultad, alquiler, dónde opera)."""
    return _set_detail(db, spot, KayakServiceDetail, KayakServiceDetailIn, body, "Kayak")


class AmenitiesSet(BaseModel):
    amenity_ids: list[int] = Field(max_length=60)


@router.put("/spots/{spot_id}/camping-amenities")
def set_camping_amenities(body: AmenitiesSet, spot: SpotDB = Depends(get_owned_spot_or_admin), db: Session = Depends(get_db)):
    """Los servicios del camping: queda exactamente esta lista."""
    wanted = set(body.amenity_ids)
    known = {a.id for a in db.query(Amenity).filter(Amenity.id.in_(wanted))} if wanted else set()
    if wanted - known:
        raise HTTPException(status_code=422, detail="Servicio desconocido")
    current = db.query(SpotAmenity).filter(SpotAmenity.spot_id == spot.id).all()
    for rel in current:
        if rel.amenity_id not in wanted:
            db.delete(rel)
    have = {rel.amenity_id for rel in current}
    for amenity_id in wanted - have:
        db.add(SpotAmenity(spot_id=spot.id, amenity_id=amenity_id))
    db.commit()
    return {"amenity_ids": sorted(wanted)}
