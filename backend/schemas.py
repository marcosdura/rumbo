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
    owner_email: str | None = None
    owner_phone: str | None = None
    is_approved: bool = False
    lat: float | None = None
    lng: float | None = None
    slug: str | None = None


# -------- CAMPING --------
class CampingDetailBase(BaseModel):
    price: float


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

    water_available: Optional[bool] = None
    camping_allowed: Optional[bool] = None
    signal: Optional[str] = None            # none / low / medium
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
    min_grade: Optional[float] = None
    max_grade: Optional[float] = None
    type: Optional[str] = None              # boulder / deportiva / tradicional
    max_altitude: Optional[int] = None
    routes_number: Optional[int] = None
    restrictions: Optional[str] = None
    slug: str | None = None


class ClimbingSectorCreate(ClimbingSectorBase):
    spot_id: int


class ClimbingSectorResponse(ClimbingSectorBase):
    id: int

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
    spot_id: int


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

class KayakDetailCreate(KayakDetail):
    spot_id: int

class KayakDetailResponse(KayakDetail):
    id: int

    class Config:
        from_attributes = True


# -------- SURF --------
class SurfSchool(BaseModel):
    name: str
    duration: Optional[float] = None            # horas
    class_type: Optional[str] = None          # grupal | privada | intensivo
    equipment_include: Optional[bool] = None

    email: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    season_start: Optional[int] = None
    season_end: Optional[int] = None


class SurfSchoolCreate(SurfSchool):
    spot_id: int


class SurfSchoolResponse(SurfSchool):
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

    category: CategoryResponse
    camping_detail: CampingDetailResponse | None = None
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
    average_rating: float | None = None
    review_count: int = 0
    owner_email: str | None = None
    owner_phone: str | None = None
    is_approved: bool = False

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
