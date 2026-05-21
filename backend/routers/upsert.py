from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from models import User
from database import SessionLocal
from auth import get_current_user
from limiter import limiter

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upsert")
@limiter.limit("20/minute")
async def upsert_user(request: Request, db: Session = Depends(get_db), user_info: dict = Depends(get_current_user)):
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
    return user