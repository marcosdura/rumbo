from models import SurfSchool
from schemas import SurfSchoolCreate, SurfSchoolResponse
from operator_router_factory import build_operator_router

router = build_operator_router(
    prefix="/surfschool",
    tags=["surfschool"],
    model=SurfSchool,
    create_schema=SurfSchoolCreate,
    response_schema=SurfSchoolResponse,
    not_found_detail="SurfSchool no encontrada",
)
