import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from database import engine
from models import Base
from routers import spots, categories, amenities, routes, sectors, kayak, surfschools, upsert, images, favorites, reviews, surf_reviews, kayak_reviews, users, glamping, climbingroutes
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

# crea la tabla en la db
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Nada de lo que este backend recibe necesita ser grande — las imágenes
# suben directo del navegador a Cloudinary, nunca pasan por acá. 1MB es de
# sobra para cualquier JSON legítimo, y frena payloads gigantes pensados
# para gastar memoria/ancho de banda. Chequea Content-Length antes de leer
# el body — no cubre requests con Transfer-Encoding: chunked sin ese header,
# pero es el caso común y no bloqueante para el resto del pipeline.
MAX_BODY_BYTES = 1 * 1024 * 1024

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Request demasiado grande"})
    return await call_next(request)

origins = ["http://localhost:3000", "https://rumbo-eight.vercel.app", "https://rumboapp.uy", "https://www.rumboapp.uy",]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Sin esto, el navegador bloquea la lectura de X-Total-Count desde el
    # frontend (headers custom no son legibles cross-origin por default,
    # aunque estén en la respuesta) — lo usa la paginación de /spots y reviews.
    expose_headers=["X-Total-Count"],
)

app.include_router(spots.router)
app.include_router(categories.router)
app.include_router(routes.router)
app.include_router(sectors.router)
app.include_router(amenities.router)
app.include_router(surfschools.router)
app.include_router(kayak.router)
app.include_router(upsert.router)
app.include_router(images.router)
app.include_router(favorites.router)
app.include_router(reviews.router)
app.include_router(surf_reviews.router)
app.include_router(kayak_reviews.router)
app.include_router(users.router)
app.include_router(glamping.router)
app.include_router(climbingroutes.router)