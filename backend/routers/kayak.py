from models import KayakDetail
from schemas import KayakDetailCreate, KayakDetailResponse
from operator_router_factory import build_operator_router

router = build_operator_router(
    prefix="/kayak",
    tags=["kayak"],
    model=KayakDetail,
    create_schema=KayakDetailCreate,
    response_schema=KayakDetailResponse,
    not_found_detail="Kayak no encontrado",
)
