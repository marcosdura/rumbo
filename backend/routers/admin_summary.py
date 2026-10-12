from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import admin_summary
from auth import get_current_admin_user
from database import get_db

router = APIRouter()


@router.get("/admin/summary")
def get_admin_summary(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """La portada del panel de admin (admin_summary.py)."""
    return admin_summary.summary(db)
