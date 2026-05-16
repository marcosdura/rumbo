from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import SpotDB, SpotAmenity, ClimbingSector, CampingDetail, Route, KayakDetail, SurfSchool
from schemas import SpotCreate, SpotResponse, ClimbingSectorResponse, CampingDetailCreate, RouteResponse, SurfSchoolResponse, KayakDetailResponse
import models
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload
from typing import Optional
from database import engine
from models import Base

Base.metadata.create_all(bind=engine)


router = APIRouter()

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def home():
    return {"message": "Spots API running"}

# Crear un spot
# usa la sesion para hablar con la DB
@router.post("/spots", response_model=SpotResponse)
def create_spot(spot: SpotCreate, db: Session = Depends(get_db)):
    
    category = db.query(models.Category).filter(models.Category.id == spot.category_id).first()
    
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    # crea una nueva fila en la tabla
    db_spot = SpotDB(
        name=spot.name,
        description=spot.description,
        department=spot.department,
        category_id=spot.category_id
    )

    # lo guarda en la db
    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)

    db_spot = (
    db.query(SpotDB)
    .options(joinedload(SpotDB.category))
    .filter(SpotDB.id == db_spot.id)
    .first()
)
    return db_spot


# Obtener los spots
@router.get("/spots", response_model=list[SpotResponse])
def get_spots(
    db: Session = Depends(get_db),
    activity: Optional[str] = None,
    department: Optional[str] = None
):
    query = db.query(SpotDB).options(
        joinedload(SpotDB.category),
        joinedload(SpotDB.amenities).joinedload(SpotAmenity.amenity),
        joinedload(SpotDB.images)
    )

    if department:
        query = query.filter(SpotDB.department == department)

    if activity:
        query = query.join(SpotDB.category).filter(models.Category.name == activity)

    spots = query.all()

    result = []
    for spot in spots:
        amenities = [sa.amenity for sa in spot.amenities if sa.amenity is not None]
        result.append({**spot.__dict__, "amenities": amenities})

    return result


#elimina un spot
@router.delete("/spots/{spot_id}")
def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    db_spot = db.query(SpotDB).filter(SpotDB.id == spot_id).first()

    if not db_spot:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(db_spot)
    db.commit()

    return {"message": "Trip deleted"}


#devuelve un spot por id
@router.get("/spots/{id}", response_model=SpotResponse)
def get_spot(id: int, db: Session = Depends(get_db)):
    spot = (
        db.query(SpotDB)
        .options(
            selectinload(SpotDB.category),
            selectinload(SpotDB.routes), 
            selectinload(SpotDB.amenities).selectinload(SpotAmenity.amenity),
            selectinload(SpotDB.images),
        )
        .filter(SpotDB.id == id)
        .first()
    )

    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    
    return {
        "id": spot.id,
        "name": spot.name,
        "description": spot.description,
        "department": spot.department,
        "lat": spot.lat,       
        "lng": spot.lng,
        "category": spot.category,
        "camping_detail": spot.camping_detail,
        "amenities": [
            sa.amenity for sa in spot.amenities if sa.amenity is not None
        ],
        "routes": spot.routes,
        "images": spot.images
    }


# agrega una amenity al spot
@router.post("/spots/{spot_id}/amenities/{amenity_id}")
def add_amenity(spot_id: int, amenity_id: int, db: Session = Depends(get_db)):

    spot = db.query(models.SpotDB).filter(models.SpotDB.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

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


# devuelve los sectores segun el spot
@router.get("/{spot_id}/sectors", response_model=list[ClimbingSectorResponse])
def get_sectors_by_spot(spot_id: int, db: Session = Depends(get_db)):
    return db.query(ClimbingSector).filter(ClimbingSector.spot_id == spot_id).all()


# agrega detalles del camping
@router.post("/spots/{spot_id}/camping")
def add_camping_detail(spot_id: int, data: CampingDetailCreate, db: Session = Depends(get_db)):
    
    camping = CampingDetail(
        spot_id=spot_id,
        price=data.price,
    )

    db.add(camping)
    db.commit()
    db.refresh(camping)

    return camping


# devuelve las rutas de trekking segun el spot
@router.get("/spots/{spot_id}/routes", response_model=list[RouteResponse])
def get_routes_by_spot(spot_id: int, db: Session = Depends(get_db)):
    return db.query(Route).filter(Route.spot_id == spot_id).all()


#devuelve los sectores de escalada segun el spot
@router.get("/spots/{spot_id}/sectors", response_model=list[ClimbingSectorResponse])
def get_sectors_by_spot(spot_id: int, db: Session = Depends(get_db)):
    sectors = db.query(ClimbingSector).filter(ClimbingSector.spot_id == spot_id).all()
    return sectors


# devuelve los detalles del kayak segun el spot
@router.get("/spots/{spot_id}/kayak-detail", response_model=KayakDetailResponse)
def get_kayak_detail(spot_id: int, db: Session = Depends(get_db)):
    kayak = db.query(KayakDetail).filter(KayakDetail.spot_id == spot_id).first()
    if not kayak:
        raise HTTPException(status_code=404, detail="Kayak no encontrado")
    return kayak


# edvuelve las escuelas de surf segun el spot
@router.get("/spots/{spot_id}/surf-school", response_model=SurfSchoolResponse)
def get_surf_school(spot_id: int, db: Session = Depends(get_db)):
    surf = db.query(SurfSchool).filter(SurfSchool.spot_id == spot_id).first()
    if not surf:
        raise HTTPException(status_code=404, detail="SurfSchool no encontrada")
    return surf