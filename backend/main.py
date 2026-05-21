from fastapi import FastAPI
from database import engine
from models import Base
from routers import spots, categories, amenities, routes, sectors, kayak, surfschools, upsert, images, favorites, reviews
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

# crea la tabla en la db
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # permite todos (desarrollo)
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