from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from auth import get_current_user_required
from limiter import limiter

router = APIRouter(prefix="/categories", tags=["categories"])



@router.post("/")
@limiter.limit("10/minute")
async def create_category(request: Request, category: schemas.CategoryCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category



@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()