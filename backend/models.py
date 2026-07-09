from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, UniqueConstraint
from database import Base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func


class SpotDB(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    department = Column(String)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    price = Column(Integer, nullable=True)

    email = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    owner_email = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    slug = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # None = abierto todo el año
    season_start = Column(Integer, nullable=True)  # 1–12
    season_end   = Column(Integer, nullable=True)  # 1–12

    is_public        = Column(Boolean, nullable=True)  # True=público, False=privado
    public_transport = Column(String, nullable=True)   # "si" | "no" | "nose"
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="spots")
    spot_categories = relationship("SpotCategory", uselist=True, back_populates="spot")
    amenities = relationship("SpotAmenity", back_populates="spot")
    camping_detail  = relationship("CampingDetail",  uselist=False, back_populates="spot")
    glamping_detail = relationship("GlampingDetail", uselist=True, back_populates="spot")
    glamping_amenities = relationship("GlampingAmenity", uselist=False, back_populates="spot")
    trekking_detail = relationship("TrekkingDetail", uselist=False, back_populates="spot")
    motorhome_detail = relationship("MotorhomeDetail", uselist=False, back_populates="spot")
    routes = relationship("Route", back_populates="spot")
    climbing_sectors = relationship("ClimbingSector", back_populates="spot")
    kayak_detail = relationship("KayakDetail", uselist=True, back_populates="spot")
    surf_schools = relationship("SurfSchool", uselist=True, back_populates="spot")
    images = relationship("SpotImage", back_populates="spot")
    favorites = relationship("Favorite", back_populates="spot")
    reviews = relationship("Review", back_populates="spot")
    experiences = relationship("Experience", back_populates="spot")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    spots = relationship("SpotDB", back_populates="category")
    spot_categories = relationship("SpotCategory", uselist=True, back_populates="category")


class SpotCategory(Base):
    __tablename__ = "spot_categories"

    spot_id     = Column(Integer, ForeignKey("spots.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)
    is_primary  = Column(Boolean, default=False)

    spot     = relationship("SpotDB", back_populates="spot_categories")
    category = relationship("Category", back_populates="spot_categories")

class GlampingDetail(Base):
    __tablename__ = "glamping_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id"))

    accommodation_type = Column(String, nullable=True)   # domo | carpa | cabaña | treehouse | otro
    capacity = Column(Integer, nullable=True)
    price_per_night = Column(Float, nullable=True)
    min_nights = Column(Integer, nullable=True)

    spot = relationship("SpotDB", back_populates="glamping_detail")


class GlampingAmenity(Base):
    __tablename__ = "glamping_amenities"

    id = Column(Integer, primary_key=True)
    glamping_id = Column(Integer, ForeignKey("glamping_details.id"), unique=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), unique=True)

    private_bathroom   = Column(Boolean, nullable=True)
    electricity        = Column(Boolean, nullable=True)
    wifi               = Column(Boolean, nullable=True)
    breakfast_included = Column(Boolean, nullable=True)
    pet_friendly       = Column(Boolean, nullable=True)
    heating            = Column(Boolean, nullable=True)
    air_conditioning   = Column(Boolean, nullable=True)
    kitchen            = Column(Boolean, nullable=True)
    towels_included    = Column(Boolean, nullable=True)
    parking            = Column(Boolean, nullable=True)

    spot = relationship("SpotDB", back_populates="glamping_amenities")


class CampingDetail(Base):
    __tablename__ = "camping_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), unique=True)
    price = Column(Float)

    spot = relationship("SpotDB", back_populates="camping_detail")


class MotorhomeDetail(Base):
    __tablename__ = "motorhome_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), unique=True)

    capacity         = Column(Integer, nullable=True)
    surface_type     = Column(String, nullable=True)
    has_water        = Column(Boolean, nullable=True)
    has_electricity  = Column(Boolean, nullable=True)
    has_dump_station = Column(Boolean, nullable=True)
    max_stay_nights  = Column(Integer, nullable=True)

    spot = relationship("SpotDB", back_populates="motorhome_detail")

class TrekkingDetail(Base):
    __tablename__ = "trekking_details"

    id        = Column(Integer, primary_key=True)
    spot_id   = Column(Integer, ForeignKey("spots.id"), unique=True)

    bathrooms     = Column(Boolean, nullable=True)
    potable_water = Column(Boolean, nullable=True)
    pet_friendly  = Column(Boolean, nullable=True)
    kids_friendly = Column(Boolean, nullable=True)
    camping       = Column(Boolean, nullable=True)
    parking       = Column(Boolean, nullable=True)
    fire_pits     = Column(Boolean, nullable=True)
    shelter       = Column(Boolean, nullable=True)
    accessible    = Column(Boolean, nullable=True)
    signal        = Column(Boolean, nullable=True)

    spot = relationship("SpotDB", back_populates="trekking_detail")


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

    spots = relationship("SpotAmenity", back_populates="amenity")

class SpotAmenity(Base):
    __tablename__ = "spot_amenities"

    spot_id = Column(Integer, ForeignKey("spots.id"), primary_key=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id"), primary_key=True)

    spot = relationship("SpotDB", back_populates="amenities")
    amenity = relationship("Amenity", back_populates="spots")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    
    spot_id = Column(Integer, ForeignKey("spots.id"))
    spot = relationship("SpotDB", back_populates="routes")

    name = Column(String)

    distance_km = Column(Float)
    duration_hours = Column(Float)
    elevation_gain = Column(Integer)
    elevation_loss = Column(Integer)

    max_altitude = Column(Integer)
    min_altitude = Column(Integer)

    difficulty = Column(String)        # fácil / moderado / difícil
    route_type = Column(String)        # circular / ida y vuelta

    technical_level = Column(String)   # bajo / medio / alto
    physical_demand = Column(String)   # bajo / medio / alto

    slug = Column(String, nullable=True, index=True)


class ClimbingSector(Base): 
    __tablename__ = "climbingsectors"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"))
    
    name = Column(String)
    type = Column(String)
    max_altitude = Column(Integer)
    restrictions = Column(String)
    slug = Column(String, nullable=True, index=True)

    spot = relationship("SpotDB", back_populates="climbing_sectors")
    routes = relationship("ClimbingRoute", back_populates="sector")

class ClimbingRoute(Base):
    __tablename__ = "climbingroutes"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, ForeignKey("climbingsectors.id"))

    name = Column(String)
    grade = Column(String)
    type = Column(String, nullable=True)
    bolts = Column(Integer)
    length = Column(Float)
    description = Column(String)

    sector = relationship("ClimbingSector", back_populates="routes")

class KayakDetail(Base):
    __tablename__ = "kayak_details"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id"))
    spot = relationship("SpotDB", back_populates="kayak_detail")

    name = Column(String)
    water_type = Column(String)       # rio | lago | mar
    difficulty = Column(String)       # facil | intermedio | dificil
    duration = Column(Float)          # horas

    kayak_type = Column(String)       # travesia | recreativo | rapido

    rental_available = Column(Boolean, default=False)

    email = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    season_start = Column(Integer, nullable=True)
    season_end = Column(Integer, nullable=True)
    photo_1 = Column(String, nullable=True)
    photo_2 = Column(String, nullable=True)
    photo_3 = Column(String, nullable=True)

    @property
    def spot_name(self):
        return self.spot.name if self.spot else None

    @property
    def spot_department(self):
        return self.spot.department if self.spot else None


class SurfSchool(Base):
    __tablename__ = "surf_beach"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id"))
    spot = relationship("SpotDB", back_populates="surf_schools")

    name = Column(String)
    class_type = Column(String)        # grupal | privada | intensivo
    duration = Column(Float)
    equipment_include = Column(Boolean)

    email = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    season_start = Column(Integer, nullable=True)
    season_end = Column(Integer, nullable=True)
    photo_1 = Column(String, nullable=True)
    photo_2 = Column(String, nullable=True)
    photo_3 = Column(String, nullable=True)

    @property
    def spot_name(self):
        return self.spot.name if self.spot else None

    @property
    def spot_department(self):
        return self.spot.department if self.spot else None


class User(Base):
    __tablename__ = "users"

    id       = Column(String, primary_key=True)  # el sub de Google
    email    = Column(String, unique=True, nullable=False)
    name     = Column(String, nullable=True)
    image    = Column(String, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    terms_accepted_at = Column(DateTime, nullable=True)
    favorites    = relationship("Favorite", back_populates="user")
    reviews      = relationship("Review", back_populates="user")
    surf_reviews = relationship("SurfReview", back_populates="user")
    kayak_reviews = relationship("KayakReview", back_populates="user")



class SpotImage(Base):
    __tablename__ = "spot_images"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"))
    cloudinary_public_id = Column(String)
    is_main = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    spot = relationship("SpotDB", back_populates="images")



class Favorite(Base):
    __tablename__ = "favorites"
 
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    spot_id    = Column(Integer, ForeignKey("spots.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    user = relationship("User", back_populates="favorites")
    spot = relationship("SpotDB", back_populates="favorites")
 
    # Un usuario no puede favoritear el mismo spot dos veces
    __table_args__ = (UniqueConstraint("user_id", "spot_id", name="uq_user_spot"),)

    

class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, index=True)
    spot_id    = Column(Integer, ForeignKey("spots.id"), nullable=False)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    rating     = Column(Integer, nullable=False)   # 1 a 5
    comment    = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    spot = relationship("SpotDB", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class SurfReview(Base):
    __tablename__ = "surf_reviews"

    id            = Column(Integer, primary_key=True, index=True)
    surf_beach_id = Column(Integer, ForeignKey("surf_beach.id"), nullable=False)
    user_id       = Column(String, ForeignKey("users.id"), nullable=False)
    rating        = Column(Integer, nullable=False)
    comment       = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    surf_school = relationship("SurfSchool")
    user        = relationship("User", back_populates="surf_reviews")


class KayakReview(Base):
    __tablename__ = "kayak_reviews"

    id               = Column(Integer, primary_key=True, index=True)
    kayak_details_id = Column(Integer, ForeignKey("kayak_details.id"), nullable=False)
    user_id          = Column(String, ForeignKey("users.id"), nullable=False)
    rating           = Column(Integer, nullable=False)
    comment          = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    kayak_detail = relationship("KayakDetail")
    user         = relationship("User", back_populates="kayak_reviews")


class Experience(Base):
    __tablename__ = "experiences"

    id          = Column(Integer, primary_key=True, index=True)
    spot_id     = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title       = Column(String(150), nullable=False)
    description = Column(String, nullable=True)
    price       = Column(Float, nullable=True)
    currency    = Column(String(3), default="UYU")
    schedule    = Column(String(255), nullable=True)
    contact     = Column(String(255), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    spot     = relationship("SpotDB", back_populates="experiences")
    category = relationship("Category")
