import os
from fastapi import FastAPI
from database import engine
from models import Base
from routers import spots, categories, amenities, routes, sectors, kayak, surfschools, upsert, images, favorites, reviews, surf_reviews, kayak_reviews, users, glamping
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

# crea la tabla en la db
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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