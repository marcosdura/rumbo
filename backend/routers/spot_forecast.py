"""GET /spots/{id}/forecast: el pronóstico de un lugar publicado (forecast.py)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, selectinload

import forecast
import home
from database import get_db
from limiter import limiter
from models import SpotCategory, SpotDB

router = APIRouter(tags=["forecast"])


@router.get("/spots/{spot_id}/forecast")
@limiter.limit("60/minute")
def spot_forecast(request: Request, spot_id: int, db: Session = Depends(get_db)):
    spot = (
        home.visible(db.query(SpotDB))
        .options(selectinload(SpotDB.category), selectinload(SpotDB.spot_categories).selectinload(SpotCategory.category))
        .filter(SpotDB.id == spot_id).first()
    )
    if not spot or spot.lat is None or spot.lng is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    # Olas solo donde se surfea (playas y escuelas de surf).
    # La principal está en spot.category; las demás, en spot_categories.
    names = {sc.category.name for sc in spot.spot_categories if sc.category} | ({spot.category.name} if spot.category else set())
    marine = "Surf" in names
    try:
        return forecast.forecast_for(spot.lat, spot.lng, marine)
    except forecast.ForecastUnavailable:
        raise HTTPException(status_code=503, detail="El pronóstico no está disponible ahora.")
