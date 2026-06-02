import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración para conectar a PostgreSQL
# Prioriza variable de entorno DATABASE_URL (Docker/Producción)
# Si no existe, usa configuración local para desarrollo
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://kullki_user:kullki_pass@localhost:5432/kullki_wasi_db"
)

# Configuración del engine con pool para conexiones externas
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_recycle=3600,   # Recicla conexiones cada hora
    echo=False           # Desactiva logs SQL en producción
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Generador de sesión de base de datos para inyección de dependencia en FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
