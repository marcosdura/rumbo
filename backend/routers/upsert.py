from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from models import User
from database import get_db
from auth import get_current_user_required
from limiter import limiter
from schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])



@router.post("/upsert", response_model=UserResponse)
@limiter.limit("20/minute")
async def upsert_user(request: Request, db: Session = Depends(get_db), user_info: dict = Depends(get_current_user_required)):
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if user:
        user.name  = user_info.get("name")
        user.image = user_info.get("picture")
    else:
        user = User(
            id    = user_info["sub"],
            email = user_info["email"],
            name  = user_info.get("name"),
            image = user_info.get("picture"),
        )
        db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/terms", response_model=UserResponse)
@limiter.limit("20/minute")
async def accept_terms(request: Request, db: Session = Depends(get_db), user_info: dict = Depends(get_current_user_required)):
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.terms_accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user
