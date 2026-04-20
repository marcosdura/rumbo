from fastapi import FastAPI
from database import engine
import models
from models import Base
from routers import spots, categories, amenities, routes, sectors, kayak, surfschools, upsert
from fastapi.middleware.cors import CORSMiddleware

# crea la tabla en la db
Base.metadata.create_all(bind=engine)

app = FastAPI()

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