from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClimbingSector
from schemas import ClimbingSectorCreate, ClimbingSectorResponse
from models import ClimbingRoute
from schemas import ClimbingRouteResponse



router = APIRouter(prefix="/sectors", tags=["sectors"])

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#crea un sector
@router.post("/", response_model=ClimbingSectorResponse)
def create_sector(sector: ClimbingSectorCreate, db: Session = Depends(get_db)):
    db_sector = ClimbingSector(**sector.dict())
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

#retorna todos los sectores
@router.get("/", response_model=list[ClimbingSectorResponse])
def get_routes(db: Session = Depends(get_db)):
    return db.query(ClimbingSector).all()

#retorna un solo sector segun el id
@router.get("/{sector_id}", response_model=ClimbingSectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    return db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()

#retorna las rutas de un sector 
@router.get("/{sector_id}/routes", response_model=list[ClimbingRouteResponse])
def get_sector_routes(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return db.query(ClimbingRoute).filter(ClimbingRoute.sector_id == sector_id).all()

