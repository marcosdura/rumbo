# Migration — run in Railway Postgres SQL editor:
# ALTER TABLE spots ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;
# UPDATE spots SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));

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
    is_approved = Column(Boolean, default=False)
    slug = Column(String, unique=True, nullable=True, index=True)

    # None = abierto todo el año
    season_start = Column(Integer, nullable=True)  # 1–12
    season_end   = Column(Integer, nullable=True)  # 1–12
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="spots")
    amenities = relationship("SpotAmenity", back_populates="spot")
    camping_detail = relationship("CampingDetail", uselist=False, back_populates="spot")
    routes = relationship("Route", back_populates="spot")
    climbing_sectors = relationship("ClimbingSector", back_populates="spot")
    kayak_detail = relationship("KayakDetail", uselist=True, back_populates="spot")
    surf_schools = relationship("SurfSchool", uselist=True, back_populates="spot")
    images = relationship("SpotImage", back_populates="spot")
    favorites = relationship("Favorite", back_populates="spot") 
    reviews = relationship("Review", back_populates="spot")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    spots = relationship("SpotDB", back_populates="category")

class CampingDetail(Base):
    __tablename__ = "camping_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), unique=True)
    price = Column(Float)

    spot = relationship("SpotDB", back_populates="camping_detail")

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

    water_available = Column(Boolean)
    camping_allowed = Column(Boolean)
    signal = Column(String)            # none / low / medium


class ClimbingSector(Base): 
    __tablename__ = "climbingsectors"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"))
    
    name = Column(String) 
    type = Column(String)
    max_altitude = Column(Integer)
    restrictions = Column(String)

    spot = relationship("SpotDB", back_populates="climbing_sectors")
    routes = relationship("ClimbingRoute", back_populates="sector")

class ClimbingRoute(Base):
    __tablename__ = "climbingroutes"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, ForeignKey("climbingsectors.id"))

    name = Column(String)
    grade = Column(String)
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


class SurfSchool(Base):
    __tablename__ = "surf_beach"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id"), unique=True)
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


class User(Base):
    __tablename__ = "users"

    id       = Column(String, primary_key=True)  # el sub de Google
    email    = Column(String, unique=True, nullable=False)
    name     = Column(String, nullable=True)
    image    = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    favorites  = relationship("Favorite", back_populates="user")
    reviews = relationship("Review", back_populates="user")



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
