from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import SurfSchool
from schemas import SurfSchoolCreate, SurfSchoolResponse
from database import SessionLocal

router = APIRouter(prefix="/surfschool", tags=["surfschool"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SurfSchoolResponse)
def create_surfschool(surfschool: SurfSchoolCreate, db: Session = Depends(get_db)):
    db_surfschool = SurfSchool(**surfschool.dict())
    db.add(db_surfschool)
    db.commit()
    db.refresh(db_surfschool)
    return db_surfschool



@router.get("/", response_model=list[SurfSchoolResponse])
def get_surfschools(db: Session = Depends(get_db)):
    return db.query(SurfSchool).all()



@router.get("/{surfschool_id}", response_model=SurfSchoolResponse)
def get_surfschool(surfschool_id: int, db: Session = Depends(get_db)):

    surfschool = db.query(SurfSchool).filter(SurfSchool.id == surfschool_id).first()

    if not surfschool:
        raise HTTPException(status_code=404, detail="SurfSchool no encontrada")

    return surfschool

