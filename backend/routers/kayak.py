from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import KayakDetail
from schemas import KayakDetailCreate, KayakDetailResponse
from database import SessionLocal

router = APIRouter(prefix="/kayak", tags=["kayak"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=KayakDetailResponse)
def create_kayak(kayak: KayakDetailCreate, db: Session = Depends(get_db)):

    existing = db.query(KayakDetail).filter(KayakDetail.spot_id == kayak.spot_id).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Este spot ya tiene kayak detail")

    db_kayak = KayakDetail(**kayak.dict())
    db.add(db_kayak)
    db.commit()
    db.refresh(db_kayak)

    return db_kayak


@router.get("/", response_model=list[KayakDetailResponse])
def get_kayaks(db: Session = Depends(get_db)):
    return db.query(KayakDetail).all()


@router.get("/{kayak_id}", response_model=KayakDetailResponse)
def get_kayak(kayak_id: int, db: Session = Depends(get_db)):

    kayak = db.query(KayakDetail).filter(KayakDetail.id == kayak_id).first()

    if not kayak:
        raise HTTPException(status_code=404, detail="Kayak no encontrado")

    return kayak

