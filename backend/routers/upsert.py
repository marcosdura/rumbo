from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import User

from database import SessionLocal

router = APIRouter(prefix="/users", tags=["users"])

# dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# guarda un usuario en la base de datos
@router.post("/upsert")
def upsert_user(data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data["email"]).first()
    if user:
        user.name  = data.get("name")
        user.image = data.get("image")
    else:
        user = User(
            id    = data["id"],
            email = data["email"],
            name  = data.get("name"),
            image = data.get("image"),
        )
        db.add(user)
    db.commit()
    return user