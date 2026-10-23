from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from pydantic import field_validator

# Valores permitidos de los datos opcionales (None = "no sé").
SunExposure = Literal["sol", "sombra", "mixto"]
RockType = Literal["granito", "basalto", "arenisca", "cuarcita", "caliza", "otra"]
SurfLevel = Literal["principiante", "intermedio", "avanzado"]
Language = Literal["espanol", "ingles", "portugues", "otro"]


# -------- CATEGORY --------
class CategoryBase(BaseModel):
    name: str = Field(max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    name: str

    class Config:
        from_attributes = True


# -------- SPOT --------
class SpotCreate(BaseModel):
    name: str = Field(max_length=200)
    description: str = Field(max_length=3000)
    department: str = Field(max_length=100)
    category_id: int
    email: str | None = Field(default=None, max_length=254)
    instagram: str | None = Field(default=None, max_length=100)
    whatsapp: str | None = Field(default=None, max_length=30)
    price: int | None = None
    season_start: Optional[int] = None  # 1–12
    season_end:   Optional[int] = None  # 1–12
    lat: float | None = None
    lng: float | None = None
    slug: str | None = Field(default=None, max_length=250)
    is_public: Optional[bool] = None
    public_transport: Optional[str] = Field(default=None, max_length=20)
    # False: lo carga un visitante, no el responsable ni el dueño. Aprobado,
    # pasa a manejarlo el admin (ownership.is_admin_managed).
    is_responsible: bool = True
    # Información práctica; None = "no sé".
    pets_allowed: Optional[bool] = None
    reservation_required: Optional[bool] = None
    cell_signal: Optional[bool] = None


class SpotEditRequest(BaseModel):
    """PATCH /admin/spots/{id}. Todos opcionales: solo se toca lo que viene
    (model_dump(exclude_unset=True)). Qué campo se aplica ya y cuál va a
    revisión lo decide spot_changes.py, no este schema."""
    name: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    department: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=254)
    instagram: str | None = Field(default=None, max_length=100)
    whatsapp: str | None = Field(default=None, max_length=30)
    price: int | None = None
    season_start: Optional[int] = None  # 1–12
    season_end:   Optional[int] = None  # 1–12
    lat: float | None = None
    lng: float | None = None
    is_public: Optional[bool] = None
    public_transport: Optional[str] = Field(default=None, max_length=20)
    # Fotos ya subidas a Cloudinary que el dueño quiere sumar.
    photos_added: list[str] = Field(default_factory=list, max_length=10)
    # Información práctica; None = "no sé". Se aplica al instante.
    pets_allowed: Optional[bool] = None
    reservation_required: Optional[bool] = None
    cell_signal: Optional[bool] = None


class ChangeRequestReject(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class SpotReject(BaseModel):
    # Obligatorio: es lo que el dueño necesita para saber qué corregir.
    reason: str = Field(min_length=1, max_length=500)


class ClaimCreate(BaseModel):
    message: str | None = Field(default=None, max_length=500)


class ClaimReject(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class ReportCreate(BaseModel):
    target_kind: str = Field(max_length=20)
    target_id: int
    reason: str = Field(max_length=20)
    comment: str | None = Field(default=None, max_length=500)


class ReportResolve(BaseModel):
    target_kind: str = Field(max_length=20)
    target_id: int
    # dismiss | delete | unpublish
    action: str = Field(max_length=20)
    # Obligatorio para despublicar un spot: lo ve su dueño.
    reason: str | None = Field(default=None, max_length=500)


class ContributionReject(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class DiscardPhotosRequest(BaseModel):
    public_ids: list[str] = Field(max_length=10)


# -------- GLAMPING --------
class GlampingAmenityCreate(BaseModel):
    private_bathroom:   Optional[bool] = None
    electricity:        Optional[bool] = None
    wifi:               Optional[bool] = None
    breakfast_included: Optional[bool] = None
    pet_friendly:       Optional[bool] = None
    heating:            Optional[bool] = None
    air_conditioning:   Optional[bool] = None
    kitchen:            Optional[bool] = None
    towels_included:    Optional[bool] = None
    parking:            Optional[bool] = None

class GlampingAmenityResponse(GlampingAmenityCreate):
    id: int
    spot_id: int

    class Config:
        from_attributes = True

class GlampingDetailCreate(BaseModel):
    accommodation_type: Optional[str]   = Field(default=None, max_length=50)
    # Más de 0: "$0 por noche" o "0 personas" no son datos. 0 noches sí:
    # es "sin mínimo".
    capacity:           Optional[int]   = Field(default=None, gt=0)
    price_per_night:    Optional[float] = Field(default=None, gt=0)
    min_nights:         Optional[int]   = Field(default=None, ge=0)

class GlampingDetailResponse(BaseModel):
    # Sin los mínimos de GlampingDetailCreate: hay unidades viejas en 0 (y la
    # respuesta también se valida: la página del lugar daba 500).
    accommodation_type: Optional[str] = None
    capacity:           Optional[int] = None
    price_per_night:    Optional[float] = None
    min_nights:         Optional[int] = None
    # False = aporte pendiente de revisión (solo lo ven su autor y el admin).
    is_approved: bool = True
    id: int
    spot_id: int

    class Config:
        from_attributes = True


# -------- CAMPING --------
class CampingDetailBase(BaseModel):
    price: Optional[float] = None


class CampingDetailCreate(CampingDetailBase):
    pass


class CampingDetailResponse(CampingDetailBase):
    id: int

    class Config:
        from_attributes = True


# -------- AMENITY --------
class AmenityResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class AmenityCreate(BaseModel):
    name: str = Field(max_length=100)


# -------- TREKKING ROUTE --------
class RouteBase(BaseModel):
    name: str = Field(max_length=200)
    distance_km: Optional[float] = None
    duration_hours: Optional[float] = None
    elevation_gain: Optional[int] = None
    elevation_loss: Optional[int] = None
    max_altitude: Optional[int] = None
    min_altitude: Optional[int] = None

    difficulty: Optional[str] = Field(default=None, max_length=50)        # fácil / moderado / difícil
    route_type: Optional[str] = Field(default=None, max_length=50)        # circular / ida y vuelta

    technical_level: Optional[str] = Field(default=None, max_length=50)   # bajo / medio / alto
    physical_demand: Optional[str] = Field(default=None, max_length=50)   # bajo / medio / alto

    description: Optional[str] = Field(default=None, max_length=2000)

    slug: str | None = Field(default=None, max_length=250)


class RouteCreate(RouteBase):
    spot_id: int


class RouteResponse(RouteBase):
    # False = aporte pendiente de revisión (solo lo ven su autor y el admin).
    is_approved: bool = True
    id: int
    spot_slug: Optional[str] = None

    class Config:
        from_attributes = True


# -------- CLIMBING SECTOR --------
class ClimbingSectorBase(BaseModel):
    name: str = Field(max_length=200)
    type: Optional[str] = Field(default=None, max_length=50)
    max_altitude: Optional[int] = None
    restrictions: Optional[str] = Field(default=None, max_length=500)
    # None = "no sé".
    approach_minutes: Optional[int] = Field(default=None, ge=0, le=600)
    sun_exposure: Optional[SunExposure] = None
    rock_type: Optional[RockType] = None
    slug: str | None = Field(default=None, max_length=250)


class ClimbingSectorCreate(ClimbingSectorBase):
    spot_id: int


class ClimbingSectorResponse(ClimbingSectorBase):
    # False = aporte pendiente de revisión (solo lo ven su autor y el admin).
    is_approved: bool = True
    id: int
    # Para que un link "sugerir una vía" pueda verificar que el sector es de
    # ese lugar.
    spot_id: int
    routes_count: int = 0
    min_grade: Optional[str] = None
    max_grade: Optional[str] = None

    class Config:
        from_attributes = True


# -------- CLIMBING ROUTE --------
class ClimbingRouteBase(BaseModel):
    name: str = Field(max_length=200)
    grade: Optional[str] = Field(default=None, max_length=20)
    type: Optional[str] = Field(default=None, max_length=50)              # boulder / deportiva / tradicional
    length: Optional[int] = None
    bolts: Optional[int] = None
    description: Optional[str] = Field(default=None, max_length=2000)


class ClimbingRouteCreate(ClimbingRouteBase):
    sector_id: int


class ClimbingRouteResponse(ClimbingRouteBase):
    # False = aporte pendiente de revisión (solo lo ven su autor y el admin).
    is_approved: bool = True
    id: int

    class Config:
        from_attributes = True


# -------- SPOT IMAGE --------
class SpotImageResponse(BaseModel):
    id: int
    cloudinary_public_id: str
    is_main: bool
    order: int

    class Config:
        from_attributes = True


# -------- TREKKING DETAIL --------
class TrekkingDetailOut(BaseModel):
    bathrooms:     bool | None = None
    potable_water: bool | None = None
    pet_friendly:  bool | None = None
    kids_friendly: bool | None = None
    camping:       bool | None = None
    parking:       bool | None = None
    fire_pits:     bool | None = None
    shelter:       bool | None = None
    accessible:    bool | None = None
    signal:        bool | None = None

    class Config:
        from_attributes = True


class TrekkingDetailCreate(TrekkingDetailOut):
    pass


# -------- ESCUELA DE SURF / SERVICIO DE KAYAK (como lugares) --------
# Lo propio de cada uno; el resto (nombre, fotos, contacto, precio,
# temporada) es del lugar. None = no sé / sin dato.
SurfClassType = Literal["grupal", "privada", "intensivo"]
KayakWater = Literal["rio", "lago", "mar"]
KayakDifficulty = Literal["facil", "intermedio", "dificil"]
KayakType = Literal["travesia", "recreativo", "rapido"]


class SurfDetailIn(BaseModel):
    class_type: Optional[SurfClassType] = None
    duration: Optional[float] = Field(default=None, gt=0, le=24)
    equipment_include: Optional[bool] = None
    levels: Optional[list[SurfLevel]] = Field(default=None, max_length=3)
    languages: Optional[list[Language]] = Field(default=None, max_length=4)
    price_note: Optional[str] = Field(default=None, max_length=60)
    operates_at: Optional[str] = Field(default=None, max_length=200)

    class Config:
        from_attributes = True


class KayakServiceDetailIn(BaseModel):
    water_type: Optional[KayakWater] = None
    difficulty: Optional[KayakDifficulty] = None
    duration: Optional[float] = Field(default=None, gt=0, le=24)
    kayak_type: Optional[KayakType] = None
    rental_available: Optional[bool] = None
    includes_guide: Optional[bool] = None
    includes_life_jacket: Optional[bool] = None
    price_note: Optional[str] = Field(default=None, max_length=60)
    operates_at: Optional[str] = Field(default=None, max_length=200)

    class Config:
        from_attributes = True


# -------- MOTORHOME DETAIL --------
class MotorhomeDetailCreate(BaseModel):
    capacity: Optional[int] = None
    surface_type: Optional[str] = Field(default=None, max_length=50)
    has_water: Optional[bool] = None
    has_electricity: Optional[bool] = None
    has_dump_station: Optional[bool] = None
    max_stay_nights: Optional[int] = None

class MotorhomeDetailResponse(MotorhomeDetailCreate):
    id: int
    spot_id: int

    class Config:
        from_attributes = True


# -------- EXPERIENCES --------
class ExperienceCreate(BaseModel):
    category_id: int
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: Optional[float] = None
    currency: str = Field(default="UYU", max_length=3)
    schedule: Optional[str] = Field(default=None, max_length=300)
    contact: Optional[str] = Field(default=None, max_length=300)
    is_active: bool = True

class ExperienceResponse(BaseModel):
    # False = aporte pendiente de revisión (solo lo ven su autor y el admin).
    is_approved: bool = True
    id: int
    spot_id: int
    category_id: int
    title: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str
    schedule: Optional[str] = None
    contact: Optional[str] = None
    is_active: bool
    created_at: datetime
    category: CategoryResponse

    class Config:
        from_attributes = True


# -------- SPOT RESPONSE --------
class SpotResponse(BaseModel):
    id: int
    name: str
    description: str
    department: str
    lat: float | None = None
    lng: float | None = None
    email: str | None = None
    instagram: str | None = None
    whatsapp: str | None = None
    price: int | None = None
    season_start: Optional[int] = None  # 1–12
    season_end:   Optional[int] = None  # 1–12
    slug: str | None = None
    created_at: datetime
    # "Última actualización" de la página del lugar (models.touch_spot_info).
    info_updated_at: datetime | None = None
    suggested_by_visitor: bool = False
    pets_allowed: bool | None = None
    reservation_required: bool | None = None
    cell_signal: bool | None = None

    category: CategoryResponse
    categories: list[CategoryResponse] = []
    camping_detail:   CampingDetailResponse  | None = None
    glamping_detail:  list[GlampingDetailResponse] = []
    glamping_amenities: GlampingAmenityResponse | None = None
    motorhome_detail: MotorhomeDetailResponse | None = None
    trekking_detail:  TrekkingDetailOut      | None = None
    # Escuela de surf / servicio de kayak (None en playas, lagunas y el resto).
    surf_detail: SurfDetailIn | None = None
    kayak_service_detail: KayakServiceDetailIn | None = None
    amenities: list[AmenityResponse] = []

    @field_validator("amenities", mode="before")
    @classmethod
    def flatten_amenities(cls, v):
        result = []
        for item in v:
            if hasattr(item, "amenity"):
                result.append(item.amenity)
            else:
                result.append(item)
        return result

    routes: list[RouteResponse] = []
    images: list[SpotImageResponse] = []
    experiences: list[ExperienceResponse] = []
    climbing_sectors: list[ClimbingSectorResponse] = []
    average_rating: float | None = None
    review_count: int = 0
    owner_email: str | None = None
    owner_phone: str | None = None
    is_approved: bool = False
    is_public: Optional[bool] = None
    public_transport: Optional[str] = None

    class Config:
        from_attributes = True


# -------- USER --------
class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    image: str | None = None
    created_at: datetime
    terms_accepted_at: datetime | None = None

    class Config:
        from_attributes = True


# -------- REVIEW --------
# Sin id: es el sub de Google de quien escribió la review — no hace falta
# exponerlo a cualquiera que pida el listado público, ReviewResponse.is_mine
# ya resuelve lo único para lo que el frontend lo necesitaba (mostrar el
# botón "Eliminar" en la review propia).
class ReviewUserResponse(BaseModel):
    name: str | None = None
    image: str | None = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    rating: int       # 1 a 5
    comment: str | None = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    # NULL = nunca se editó. La UI muestra "editado" solo cuando tiene valor.
    updated_at: datetime | None = None
    user: ReviewUserResponse
    is_mine: bool = False
    # Su foto publicada; la del autor también mientras está en revisión
    # ({"id", "cloudinary_public_id", "pending"}). item_photos.review_photos.
    photo: dict | None = None

    class Config:
        from_attributes = True


# -------- SPOT CATEGORY --------
class SpotCategoryAddRequest(BaseModel):
    category: str = Field(max_length=50)
    motorhome_detail: Optional[MotorhomeDetailCreate] = None
    camping_detail: Optional[CampingDetailCreate] = None
    glamping_detail: Optional[GlampingDetailCreate] = None
    glamping_amenities: Optional[GlampingAmenityCreate] = None
