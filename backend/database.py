from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

# pool_pre_ping: antes de usar una conexión guardada, se fija que siga viva.
# Sin esto, si Postgres se reiniciaba (mantenimiento de Railway, por ejemplo),
# los primeros pedidos usaban conexiones muertas y fallaban con 500.
# pool_recycle: las conexiones de más de 30 minutos se renuevan (los proxies
# cortan las conexiones quietas por mucho tiempo).
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=1800)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
