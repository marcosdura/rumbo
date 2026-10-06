from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import ClimbingRoute, ClimbingSector
from schemas import ClimbingRouteCreate, ClimbingRouteResponse
from auth import get_current_user_required, is_admin
import contributions
from limiter import limiter

router = APIRouter(prefix="/climbingroutes", tags=["climbingroutes"])

@router.post("/", response_model=ClimbingRouteResponse)
@limiter.limit("10/minute")
async def create_climbing_route(request: Request, route: ClimbingRouteCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user_required)):
    sector = db.query(ClimbingSector).filter(ClimbingSector.id == route.sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")

    if not sector.is_approved:
        # Sector sugerido que todavía está en revisión: solo su autor (o el
        # admin) le carga vías, y van con el sector — sin registro propio, se
        # aprueban o rechazan junto con él. Para cualquier otro, no existe.
        sector_contribution = contributions.pending_contribution_for(db, "climbing_sector", sector.id)
        author = sector_contribution.author_email if sector_contribution else None
        if not is_admin(user) and author != user.get("email"):
            raise HTTPException(status_code=404, detail="Sector not found")
        db_route = ClimbingRoute(**route.dict(), is_approved=False)
        db.add(db_route)
        db.commit()
        db.refresh(db_route)
        return db_route

    pending = contributions.decide(sector.spot, "climbing_route", user)
    db_route = ClimbingRoute(**route.dict())
    db.add(db_route)
    db.flush()
    contributions.register(db, "climbing_route", db_route, sector.spot, user, pending)
    db.commit()
    db.refresh(db_route)
    return db_route
