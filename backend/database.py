from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# base de datos local (archivo)
SQLALCHEMY_DATABASE_URL = "sqlite:///./trips.db"

# puente entre el codigo y la db
engine = create_engine(SQLALCHEMY_DATABASE_URL)

#creamos la sesion: conexion temporal para hacer queries, guardar datos y leerlos
SessionLocal = sessionmaker(bind=engine)

#clase para definir tablas
Base = declarative_base()

