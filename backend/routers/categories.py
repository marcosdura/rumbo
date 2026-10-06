from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from auth import get_current_admin_user
from limiter import limiter

router = APIRouter(prefix="/categories", tags=["categories"])



# Catálogo global: lo que se cree acá lo ven todos los usuarios. Antes lo
# podía crear cualquier logueado; el frontend nunca lo llama.
@router.post("/")
@limiter.limit("10/minute")
async def create_category(request: Request, category: schemas.CategoryCreate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category



@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()