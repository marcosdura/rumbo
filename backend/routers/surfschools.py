from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import SurfSchool
from schemas import SurfSchoolCreate, SurfSchoolResponse
from database import SessionLocal
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter

router = APIRouter(prefix="/surfschool", tags=["surfschool"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SurfSchoolResponse)
@limiter.limit("10/minute")
async def create_surfschool(
    request: Request,
    surfschool: SurfSchoolCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    assert_owns_spot(db, surfschool.spot_id, user)
    db_surfschool = SurfSchool(**surfschool.dict())
    db.add(db_surfschool)
    db.commit()
    db.refresh(db_surfschool)
    return db_surfschool



@router.get("/ids")
def get_surfschool_ids(db: Session = Depends(get_db)):
    # {id, name} en vez de solo id — el sitemap arma un slug cosmético
    # (/surf/nombre-slug-id) y necesita el nombre para eso.
    rows = db.query(SurfSchool.id, SurfSchool.name).all()
    return [{"id": r.id, "name": r.name} for r in rows]


@router.get("/", response_model=list[SurfSchoolResponse])
def get_surfschools(db: Session = Depends(get_db)):
    return db.query(SurfSchool).all()


@router.get("/{surfschool_id}", response_model=SurfSchoolResponse)
def get_surfschool(surfschool_id: int, db: Session = Depends(get_db)):

    surfschool = db.query(SurfSchool).filter(SurfSchool.id == surfschool_id).first()

    if not surfschool:
        raise HTTPException(status_code=404, detail="SurfSchool no encontrada")

    return surfschool

