from pydantic import BaseModel
from typing import Optional


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
    category_id: int  # 👈 reemplaza activity

class SpotResponse(BaseModel):
    id: int
    name: str
    description: str
    department: str
    category: CategoryResponse  # 👈 importante

    camping_detail: CampingDetailResponse | None = None
    amenities: list[AmenityResponse] = []
    routes: list[RouteResponse] = []

    class Config:
        from_attributes = True


# -------- CAMPING --------
class CampingDetailBase(BaseModel):
    price: float


class CampingDetailCreate(CampingDetailBase):
    pass


class CampingDetailResponse(CampingDetailBase):
    id: int

    class Config:
        from_attributes = True


class AmenityResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class AmenityCreate(BaseModel):
    name: str
    


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


class RouteCreate(RouteBase):
    spot_id: int


class RouteResponse(RouteBase):
    id: int

    class Config:
        from_attributes = True

class ClimbingSectorBase(BaseModel):
    name: str
    min_grade: Optional[float] = None
    max_grade: Optional[float] = None
    type: Optional[str] = None              # boulder / deportiva / tradicional
    max_altitude: Optional[int] = None
    routes_number: Optional[int] = None
    restrictions: Optional[str] = None
    
  

class ClimbingSectorCreate(ClimbingSectorBase):
    spot_id: int


class ClimbingSectorResponse(ClimbingSectorBase):
    id: int

    class Config:
        from_attributes = True


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