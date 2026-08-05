from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pydantic import field_validator


# -------- CATEGORY --------
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    name: str

    class Config:
        from_attributes = True


# -------- SPOT --------
class SpotCreate(BaseModel):
    name: str
    description: str
    department: str
    category_id: int
    email: str | None = None
    instagram: str | None = None
    whatsapp: str | None = None
    price: int | None = None
    season_start: Optional[int] = None  # 1–12
    season_end:   Optional[int] = None  # 1–12
    lat: float | None = None
    lng: float | None = None
    slug: str | None = None
    is_public: Optional[bool] = None
    public_transport: Optional[str] = None


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
    accommodation_type: Optional[str]   = None
    capacity:           Optional[int]   = None
    price_per_night:    Optional[float] = None
    min_nights:         Optional[int]   = None

class GlampingDetailResponse(GlampingDetailCreate):
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
    name: str


# -------- TREKKING ROUTE --------
class RouteBase(BaseModel):
    name: str
    distance_km: Optional[float] = None
    duration_hours: Optional[float] = None
    elevation_gain: Optional[int] = None
    elevation_loss: Optional[int] = None
    max_altitude: Optional[int] = None
    min_altitude: Optional[int] = None

    difficulty: Optional[str] = None        # fácil / moderado / difícil
    route_type: Optional[str] = None        # circular / ida y vuelta

    technical_level: Optional[str] = None   # bajo / medio / alto
    physical_demand: Optional[str] = None   # bajo / medio / alto

    slug: str | None = None


class RouteCreate(RouteBase):
    spot_id: int


class RouteResponse(RouteBase):
    id: int

    class Config:
        from_attributes = True


# -------- CLIMBING SECTOR --------
class ClimbingSectorBase(BaseModel):
    name: str
    type: Optional[str] = None
    max_altitude: Optional[int] = None
    restrictions: Optional[str] = None
    slug: str | None = None


class ClimbingSectorCreate(ClimbingSectorBase):
    spot_id: int


class ClimbingSectorResponse(ClimbingSectorBase):
    id: int
    routes_count: int = 0
    min_grade: Optional[str] = None
    max_grade: Optional[str] = None

    class Config:
        from_attributes = True


# -------- CLIMBING ROUTE --------
class ClimbingRouteBase(BaseModel):
    name: str
    grade: Optional[str] = None
    type: Optional[str] = None              # boulder / deportiva / tradicional
    length: Optional[int] = None
    bolts: Optional[int] = None
    description: Optional[str] = None


class ClimbingRouteCreate(ClimbingRouteBase):
    sector_id: int


class ClimbingRouteResponse(ClimbingRouteBase):
    id: int

    class Config:
        from_attributes = True


# -------- KAYAK --------
class KayakDetail(BaseModel):
    name: str
    water_type: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[float] = None
    kayak_type: Optional[str] = None
    rental_available: Optional[bool] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    season_start: Optional[int] = None
    season_end: Optional[int] = None
    photo_1: Optional[str] = None
    photo_2: Optional[str] = None
    photo_3: Optional[str] = None

class KayakDetailCreate(KayakDetail):
    spot_id: int

class KayakDetailResponse(KayakDetail):
    id: int
    spot_id: Optional[int] = None
    spot_name: Optional[str] = None
    spot_department: Optional[str] = None

    class Config:
        from_attributes = True


# -------- SURF --------
class SurfSchool(BaseModel):
    name: str
    duration: Optional[float] = None
    class_type: Optional[str] = None
    equipment_include: Optional[bool] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    season_start: Optional[int] = None
    season_end: Optional[int] = None
    photo_1: Optional[str] = None
    photo_2: Optional[str] = None
    photo_3: Optional[str] = None


class SurfSchoolCreate(SurfSchool):
    spot_id: int


class SurfSchoolResponse(SurfSchool):
    id: int
    spot_id: Optional[int] = None
    spot_name: Optional[str] = None
    spot_department: Optional[str] = None

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


# -------- MOTORHOME DETAIL --------
class MotorhomeDetailCreate(BaseModel):
    capacity: Optional[int] = None
    surface_type: Optional[str] = None
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
    title: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "UYU"
    schedule: Optional[str] = None
    contact: Optional[str] = None
    is_active: bool = True

class ExperienceResponse(BaseModel):
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

    category: CategoryResponse
    categories: list[CategoryResponse] = []
    camping_detail:   CampingDetailResponse  | None = None
    glamping_detail:  list[GlampingDetailResponse] = []
    glamping_amenities: GlampingAmenityResponse | None = None
    motorhome_detail: MotorhomeDetailResponse | None = None
    trekking_detail:  TrekkingDetailOut      | None = None
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
class ReviewUserResponse(BaseModel):
    id: str
    name: str | None = None
    image: str | None = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    rating: int       # 1 a 5
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    user: ReviewUserResponse

    class Config:
        from_attributes = True


class SurfReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    user: ReviewUserResponse

    class Config:
        from_attributes = True


class KayakReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    user: ReviewUserResponse

    class Config:
        from_attributes = True


# -------- SPOT CATEGORY --------
class SpotCategoryAddRequest(BaseModel):
    category: str
    motorhome_detail: Optional[MotorhomeDetailCreate] = None
    camping_detail: Optional[CampingDetailCreate] = None
    glamping_detail: Optional[GlampingDetailCreate] = None
    glamping_amenities: Optional[GlampingAmenityCreate] = None
