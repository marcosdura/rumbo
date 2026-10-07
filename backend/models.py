from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime, UniqueConstraint, Index, JSON, Text, Numeric, text, true, false
from database import Base
from sqlalchemy import event
from sqlalchemy.orm import Session, relationship, with_loader_criteria
from datetime import datetime
from sqlalchemy.sql import func


class ReviewedContent:
    """Modelos que pueden ser un aporte pendiente de revisión: experiencias,
    unidades de glamping, rutas, sectores, vías, surf y kayak. Ver
    contributions.py y hide_pending_contributions al final de este archivo.
    """
    # False = aporte pendiente (existe pero el público no lo ve).
    # server_default true: todo lo cargado antes de la revisión de aportes
    # quedó aprobado.
    is_approved = Column(Boolean, nullable=False, default=True, server_default=true(), index=True)


class SpotDB(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    department = Column(String, index=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    price = Column(Integer, nullable=True)

    email = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    owner_email = Column(String, nullable=True, index=True)
    owner_phone = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False, index=True)
    # NULL = spot normal. Con fecha = el dueño borró su cuenta ese día: el
    # spot se desactiva (deja de mostrarse públicamente) en vez de borrarse,
    # y pasa a la pestaña "Cuentas eliminadas" del panel admin.
    owner_deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    # Rechazado (spot nuevo) o despublicado (spot que estaba aprobado) por el
    # admin, con el motivo que ve el dueño. Con fecha = esperando que el
    # dueño corrija y lo vuelva a enviar (POST /spots/{id}/resubmit); NULL =
    # pendiente normal o aprobado.
    rejection_reason = Column(String, nullable=True)
    rejected_at      = Column(DateTime(timezone=True), nullable=True)
    slug = Column(String, unique=True, nullable=True)
    # Índice: es la columna de ORDER BY de get_spots — ordenar + LIMIT/OFFSET
    # sin índice acá es el peor caso posible para paginar.
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # None = abierto todo el año
    season_start = Column(Integer, nullable=True)  # 1–12
    season_end   = Column(Integer, nullable=True)  # 1–12

    is_public        = Column(Boolean, nullable=True)  # True=público, False=privado
    public_transport = Column(String, nullable=True)   # "si" | "no" | "nose"
    # Lo cargó alguien que no es el responsable ni el dueño (un visitante):
    # mientras está en revisión lo maneja esa persona; aprobado, pasa al
    # admin, como las playas (ownership.is_admin_managed).
    suggested_by_visitor = Column(Boolean, nullable=False, default=False, server_default=false())
    
    category_id = Column(Integer, ForeignKey("categories.id"), index=True)
    category = relationship("Category", back_populates="spots")
    # cascade="all, delete-orphan" en todas estas: borrar un spot borra todo
    # lo que cuelga de él a nivel ORM (SQLAlchemy arma el orden de DELETEs
    # solo), sin tocar el schema real de Postgres ni requerir migración —
    # antes, delete_spot hacía un DELETE FROM spots crudo que rompía con
    # IntegrityError apenas el spot tenía cualquier fila asociada.
    spot_categories = relationship("SpotCategory", uselist=True, back_populates="spot", cascade="all, delete-orphan")
    amenities = relationship("SpotAmenity", back_populates="spot", cascade="all, delete-orphan")
    camping_detail  = relationship("CampingDetail",  uselist=False, back_populates="spot", cascade="all, delete-orphan")
    glamping_detail = relationship("GlampingDetail", uselist=True, back_populates="spot", cascade="all, delete-orphan")
    glamping_amenities = relationship("GlampingAmenity", uselist=False, back_populates="spot", cascade="all, delete-orphan")
    trekking_detail = relationship("TrekkingDetail", uselist=False, back_populates="spot", cascade="all, delete-orphan")
    motorhome_detail = relationship("MotorhomeDetail", uselist=False, back_populates="spot", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="spot", cascade="all, delete-orphan")
    climbing_sectors = relationship("ClimbingSector", back_populates="spot", cascade="all, delete-orphan")
    kayak_detail = relationship("KayakDetail", uselist=True, back_populates="spot", cascade="all, delete-orphan")
    surf_schools = relationship("SurfSchool", uselist=True, back_populates="spot", cascade="all, delete-orphan")
    images = relationship("SpotImage", back_populates="spot", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="spot", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="spot", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="spot", cascade="all, delete-orphan")
    change_requests = relationship("SpotChangeRequest", back_populates="spot", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="spot", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="spot", cascade="all, delete-orphan")
    operator_change_requests = relationship("OperatorChangeRequest", back_populates="spot", cascade="all, delete-orphan")


class SpotChangeRequest(Base):
    """Pedido de cambio sobre un spot YA aprobado. Los campos sensibles
    (nombre, descripción, fotos nuevas) no se escriben en SpotDB: quedan acá
    hasta que el admin aprueba, así el público sigue viendo la versión
    aprobada sin tocar ningún endpoint de lectura. La lógica vive en
    spot_changes.py.

    changes es un JSON con solo lo que cambió:
      {"name": {"from": "...", "to": "..."},
       "description": {"from": "...", "to": "..."},
       "photos_added": ["rumbo/spots/12/ab12...", ...]}
    Las fotos de photos_added ya están subidas a Cloudinary pero sin fila en
    spot_images, así que no se ven en ningún lado hasta aprobarse.
    """
    __tablename__ = "spot_change_requests"

    # Un solo pedido pendiente por spot. Índice único PARCIAL: los aprobados,
    # rechazados y cancelados quedan como historial sin chocar entre sí.
    # spot_changes.py devuelve 409 antes de llegar acá; esto cubre la carrera
    # de dos requests simultáneos (ej. doble click en Guardar).
    __table_args__ = (
        Index(
            "uq_spot_change_pending", "spot_id", unique=True,
            postgresql_where=text("status = 'pending'"),
            sqlite_where=text("status = 'pending'"),
        ),
    )

    id           = Column(Integer, primary_key=True, index=True)
    spot_id      = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(String, nullable=False)  # email del dueño
    # "pending" | "approved" | "rejected" | "cancelled"
    status       = Column(String, nullable=False, default="pending", index=True)
    changes      = Column(JSON, nullable=False)
    # Comentario opcional del admin al rechazar; el dueño lo ve en su dashboard.
    reject_reason = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at  = Column(DateTime(timezone=True), nullable=True)
    resolved_by  = Column(String, nullable=True)
    # El dueño ve "aprobado"/"rechazado" en su dashboard hasta cerrarlo.
    # NULL = todavía no lo cerró (o el pedido sigue pendiente).
    owner_dismissed_at = Column(DateTime(timezone=True), nullable=True)

    spot = relationship("SpotDB", back_populates="change_requests")


class OperatorChangeRequest(Base):
    """Pedido de cambio sobre una escuela de surf o un servicio de kayak ya
    aprobado: lo mismo que SpotChangeRequest para los spots (nombre y fotos
    a revisión; el resto se aplica al instante). Ver operators.py.

    changes: {"name": {"from", "to"}, "photos": {"from": [...], "to": [...]}}
    Las fotos son las 3 del operador (URLs); "to" es como quedarían.
    """
    __tablename__ = "operator_change_requests"
    __table_args__ = (
        Index(
            "uq_operator_change_pending", "kind", "operator_id", unique=True,
            postgresql_where=text("status = 'pending'"),
            sqlite_where=text("status = 'pending'"),
        ),
    )

    id            = Column(Integer, primary_key=True, index=True)
    kind          = Column(String, nullable=False)   # "surf_school" | "kayak"
    # Sin FK: apunta a surf_beach o kayak_details según kind. Al borrar el
    # operador se cancelan sus pedidos (operators.cancel_pending_change).
    operator_id   = Column(Integer, nullable=False)
    spot_id       = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by  = Column(String, nullable=False)
    # "pending" | "approved" | "rejected" | "cancelled"
    status        = Column(String, nullable=False, default="pending", index=True)
    changes       = Column(JSON, nullable=False)
    reject_reason = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at   = Column(DateTime(timezone=True), nullable=True)
    resolved_by   = Column(String, nullable=True)
    owner_dismissed_at = Column(DateTime(timezone=True), nullable=True)

    spot = relationship("SpotDB", back_populates="operator_change_requests")


class Notification(Base):
    """Aviso dentro de la app (notifications.py): la campanita del Navbar."""
    __tablename__ = "notifications"
    __table_args__ = (
        # La consulta de siempre: las no leídas de un usuario.
        Index("ix_notifications_user_unread", "user_email", "read_at"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    # spot_approved | spot_rejected | change_approved | ... (texto libre:
    # el frontend solo lo usa para el ícono).
    kind       = Column(String, nullable=False)
    title      = Column(String, nullable=False)
    body       = Column(String, nullable=True)
    # A dónde lleva al tocarla (ruta del frontend).
    link       = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at    = Column(DateTime(timezone=True), nullable=True)


class SpotClaim(Base):
    """Pedido de alguien que dice ser el responsable o dueño de un lugar que
    sugirió un visitante (spots.suggested_by_visitor). Lo decide el admin
    (claims.py); si lo aprueba, el lugar pasa a ser de esa persona."""
    __tablename__ = "spot_claims"
    # Un pedido en revisión por persona y por lugar.
    __table_args__ = (
        Index(
            "uq_claim_pending", "spot_id", "user_email", unique=True,
            postgresql_where=text("status = 'pending'"),
            sqlite_where=text("status = 'pending'"),
        ),
    )

    id            = Column(Integer, primary_key=True, index=True)
    spot_id       = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    user_email    = Column(String, nullable=False, index=True)
    # Cómo verificarlo (opcional): su rol, un teléfono, una web...
    message       = Column(String, nullable=True)
    # pending | approved | rejected
    status        = Column(String, nullable=False, default="pending", index=True)
    reject_reason = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at   = Column(DateTime(timezone=True), nullable=True)


class Report(Base):
    """Un reporte de un usuario sobre algo publicado: un spot, una reseña o
    una escuela/kayak (reports.py). Solo avisa: nada se oculta por cantidad
    de reportes, siempre decide el admin."""
    __tablename__ = "reports"
    # Un reporte abierto por persona y por cosa reportada.
    __table_args__ = (
        Index(
            "uq_report_open", "reporter_email", "target_kind", "target_id", unique=True,
            postgresql_where=text("status = 'open'"),
            sqlite_where=text("status = 'open'"),
        ),
    )

    id             = Column(Integer, primary_key=True, index=True)
    # spot | review | surf_review | kayak_review | surf_school | kayak
    target_kind    = Column(String, nullable=False)
    # Sin FK: apunta a tablas distintas según target_kind.
    target_id      = Column(Integer, nullable=False)
    # Lugar al que pertenece (para agruparlo y enlazarlo). Borrar el lugar
    # borra sus reportes.
    spot_id        = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_email = Column(String, nullable=False, index=True)
    # false_info | offensive | spam | wrong_photos | closed | other
    reason         = Column(String, nullable=False)
    comment        = Column(String, nullable=True)
    # open | dismissed | actioned
    status         = Column(String, nullable=False, default="open", index=True)
    # Qué hizo el admin: dismissed | unpublished | deleted
    resolution     = Column(String, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at    = Column(DateTime(timezone=True), nullable=True)
    resolved_by    = Column(String, nullable=True)

    spot = relationship("SpotDB", back_populates="reports")


class Contribution(Base):
    """Registro de un aporte (algo nuevo sumado a un spot ya aprobado) y su
    revisión. El aporte en sí vive en su tabla de siempre con is_approved =
    False; esta tabla guarda quién lo propuso, el estado y el motivo de
    rechazo. Al rechazar, el elemento se borra pero este registro queda, para
    que el autor vea el resultado en /profile. La lógica vive en
    contributions.py.
    """
    __tablename__ = "contributions"

    id           = Column(Integer, primary_key=True, index=True)
    # experience | glamping_unit | trekking_route | climbing_sector |
    # climbing_route | surf_school | kayak
    kind         = Column(String, nullable=False)
    # Id en la tabla del aporte. Sin FK: apunta a tablas distintas según
    # kind, y después de un rechazo el elemento ya no existe.
    item_id      = Column(Integer, nullable=False)
    spot_id      = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    author_email = Column(String, nullable=False, index=True)
    # "pending" | "approved" | "rejected" | "withdrawn"
    status       = Column(String, nullable=False, default="pending", index=True)
    # Nombre del elemento al proponerlo: sigue sirviendo para mostrar el
    # aporte aunque se haya rechazado y borrado.
    title        = Column(String, nullable=False)
    reject_reason = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at  = Column(DateTime(timezone=True), nullable=True)
    resolved_by  = Column(String, nullable=True)
    # El autor ve el resultado en /profile hasta cerrarlo.
    author_dismissed_at = Column(DateTime(timezone=True), nullable=True)

    spot = relationship("SpotDB", back_populates="contributions")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    spots = relationship("SpotDB", back_populates="category")
    spot_categories = relationship("SpotCategory", uselist=True, back_populates="category")


class SpotCategory(Base):
    __tablename__ = "spot_categories"

    spot_id     = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)
    is_primary  = Column(Boolean, default=False, nullable=False)

    spot     = relationship("SpotDB", back_populates="spot_categories")
    category = relationship("Category", back_populates="spot_categories")

class GlampingDetail(ReviewedContent, Base):
    __tablename__ = "glamping_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)

    accommodation_type = Column(String, nullable=True)   # domo | carpa | cabaña | treehouse | otro
    capacity = Column(Integer, nullable=True)
    price_per_night = Column(Float, nullable=True)
    min_nights = Column(Integer, nullable=True)

    spot = relationship("SpotDB", back_populates="glamping_detail")


class GlampingAmenity(Base):
    __tablename__ = "glamping_amenities"

    id = Column(Integer, primary_key=True)
    glamping_id = Column(Integer, ForeignKey("glamping_details.id", ondelete="CASCADE"), unique=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), unique=True)

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
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), unique=True)
    price = Column(Float)

    spot = relationship("SpotDB", back_populates="camping_detail")


class MotorhomeDetail(Base):
    __tablename__ = "motorhome_details"

    id = Column(Integer, primary_key=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), unique=True, nullable=False)

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
    spot_id   = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), unique=True)

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

    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id"), primary_key=True)

    spot = relationship("SpotDB", back_populates="amenities")
    amenity = relationship("Amenity", back_populates="spots")


class Route(ReviewedContent, Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)
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


class ClimbingSector(ReviewedContent, Base): 
    __tablename__ = "climbingsectors"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)

    name = Column(String)
    type = Column(String)
    max_altitude = Column(Integer)
    restrictions = Column(String)
    slug = Column(String, nullable=True, index=True)

    spot = relationship("SpotDB", back_populates="climbing_sectors")
    routes = relationship("ClimbingRoute", back_populates="sector", cascade="all, delete-orphan")

class ClimbingRoute(ReviewedContent, Base):
    __tablename__ = "climbingroutes"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, ForeignKey("climbingsectors.id", ondelete="CASCADE"))

    name = Column(String)
    grade = Column(String)
    type = Column(String, nullable=True)
    bolts = Column(Integer)
    length = Column(Float)
    description = Column(String)

    sector = relationship("ClimbingSector", back_populates="routes")

class KayakDetail(ReviewedContent, Base):
    __tablename__ = "kayak_details"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)
    # Dueño propio de la escuela/servicio (quien lo sumó a la playa), distinto
    # del dueño del lugar. NULL = lo maneja el admin (los de antes de esto).
    owner_email = Column(String, nullable=True, index=True)
    spot = relationship("SpotDB", back_populates="kayak_detail")
    # Sin esto, borrar un spot con servicios de kayak fallaba: KayakReview
    # tiene FK a kayak_details.id, y esa cascada no se disparaba sola
    # porque no había ninguna relación (en ningún sentido) entre las dos.
    reviews = relationship("KayakReview", back_populates="kayak_detail", cascade="all, delete-orphan")

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


class SurfSchool(ReviewedContent, Base):
    __tablename__ = "surf_beach"

    id = Column(Integer, primary_key=True, index=True)

    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)
    # Dueño propio de la escuela/servicio (quien lo sumó a la playa), distinto
    # del dueño del lugar. NULL = lo maneja el admin (los de antes de esto).
    owner_email = Column(String, nullable=True, index=True)
    spot = relationship("SpotDB", back_populates="surf_schools")
    # Idem KayakDetail.reviews — sin esto, borrar un spot con escuelas de
    # surf fallaba por la FK de SurfReview a surf_beach.id sin cascada.
    reviews = relationship("SurfReview", back_populates="surf_school", cascade="all, delete-orphan")

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
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), index=True)
    cloudinary_public_id = Column(String)
    is_main = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    spot = relationship("SpotDB", back_populates="images")



class Favorite(Base):
    __tablename__ = "favorites"
 
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    spot_id    = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    user = relationship("User", back_populates="favorites")
    spot = relationship("SpotDB", back_populates="favorites")
 
    # Un usuario no puede favoritear el mismo spot dos veces
    __table_args__ = (UniqueConstraint("user_id", "spot_id", name="uq_user_spot"),)

    

class Review(Base):
    __tablename__ = "reviews"

    # Una reseña por usuario y por lugar. Sin esto una sola persona podía
    # dejar reseñas ilimitadas sobre el mismo spot, todas contando para el
    # promedio y el total — que es lo que ordena el listado.
    # El nombre no puede ser "uq_user_spot": ese ya lo usa Favorite, y en
    # Postgres una constraint UNIQUE crea un índice, cuyos nombres son
    # únicos por esquema.
    __table_args__ = (UniqueConstraint("user_id", "spot_id", name="uq_review_user_spot"),)

    id         = Column(Integer, primary_key=True, index=True)
    spot_id    = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating     = Column(Integer, nullable=False)   # 1 a 5
    comment    = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # NULL = nunca se editó. Se muestra como "editado" en la UI.
    updated_at = Column(DateTime(timezone=True), nullable=True)

    spot = relationship("SpotDB", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class SurfReview(Base):
    __tablename__ = "surf_reviews"

    __table_args__ = (UniqueConstraint("user_id", "surf_beach_id", name="uq_surfreview_user_beach"),)

    id            = Column(Integer, primary_key=True)
    surf_beach_id = Column(Integer, ForeignKey("surf_beach.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating        = Column(Integer, nullable=False)
    comment       = Column(Text, nullable=True)
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), nullable=True)

    surf_school = relationship("SurfSchool", back_populates="reviews")
    user        = relationship("User", back_populates="surf_reviews")


class KayakReview(Base):
    __tablename__ = "kayak_reviews"

    __table_args__ = (UniqueConstraint("user_id", "kayak_details_id", name="uq_kayakreview_user_detail"),)

    id               = Column(Integer, primary_key=True)
    kayak_details_id = Column(Integer, ForeignKey("kayak_details.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id          = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating           = Column(Integer, nullable=False)
    comment          = Column(Text, nullable=True)
    created_at       = Column(DateTime, server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), nullable=True)

    kayak_detail = relationship("KayakDetail", back_populates="reviews")
    user         = relationship("User", back_populates="kayak_reviews")


class Experience(ReviewedContent, Base):
    __tablename__ = "experiences"
    __table_args__ = (
        Index("idx_experiences_spot_id", "spot_id"),
        Index("idx_experiences_category_id", "category_id"),
    )

    id          = Column(Integer, primary_key=True)
    spot_id     = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title       = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price       = Column(Numeric(10, 2), nullable=True)
    currency    = Column(String(3), default="UYU")
    schedule    = Column(String(255), nullable=True)
    contact     = Column(String(255), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, server_default=func.now())

    spot     = relationship("SpotDB", back_populates="experiences")
    category = relationship("Category")


@event.listens_for(Session, "do_orm_execute")
def hide_pending_contributions(state):
    """Los aportes pendientes no existen para ninguna consulta, salvo que la
    consulta lo pida con .execution_options(include_pending=True).

    Seguro por defecto: en vez de acordarse de filtrar is_approved en cada
    lectura pública (página del spot, rutas y sectores por slug, listados de
    surf/kayak, sitemap, conteo de vías, filtros de búsqueda, reseñas...),
    with_loader_criteria lo agrega a toda consulta de estos modelos — también
    en los JOIN y en las relaciones que se cargan a partir de ella. Las
    excepciones (revisión del admin, el autor, borrados) son pocas y se
    marcan a mano.
    """
    if (
        state.is_select
        and not state.is_column_load
        and not state.is_relationship_load
        and not state.execution_options.get("include_pending", False)
    ):
        state.statement = state.statement.options(
            with_loader_criteria(ReviewedContent, lambda cls: cls.is_approved == True, include_aliases=True)
        )
