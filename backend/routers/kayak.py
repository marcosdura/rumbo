from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import KayakDetail
from schemas import KayakDetailCreate, KayakDetailResponse
from database import get_db
from auth import get_current_user_required
from ownership import assert_owns_spot
from limiter import limiter

router = APIRouter(prefix="/kayak", tags=["kayak"])


@router.post("/", response_model=KayakDetailResponse)
@limiter.limit("10/minute")
async def create_kayak(
    request: Request,
    kayak: KayakDetailCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user_required),
):
    assert_owns_spot(db, kayak.spot_id, user)
    db_kayak = KayakDetail(**kayak.dict())
    db.add(db_kayak)
    db.commit()
    db.refresh(db_kayak)
    return db_kayak



@router.get("/ids")
def get_kayak_ids(db: Session = Depends(get_db)):
    # {id, name} en vez de solo id — el sitemap arma un slug cosmético
    # (/kayak/nombre-slug-id) y necesita el nombre para eso.
    rows = db.query(KayakDetail.id, KayakDetail.name).all()
    return [{"id": r.id, "name": r.name} for r in rows]


@router.get("/", response_model=list[KayakDetailResponse])
def get_kayaks(db: Session = Depends(get_db)):
    return db.query(KayakDetail).all()


@router.get("/{kayak_id}", response_model=KayakDetailResponse)
def get_kayak(kayak_id: int, db: Session = Depends(get_db)):

    kayak = db.query(KayakDetail).filter(KayakDetail.id == kayak_id).first()

    if not kayak:
        raise HTTPException(status_code=404, detail="Kayak no encontrado")

    return kayak

