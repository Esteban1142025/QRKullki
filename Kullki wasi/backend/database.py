import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración para conectar a MySQL local usando pymysql
# Se asume servidor local en el puerto 3306, usuario root sin contraseña, base kullkidb
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:@localhost:3306/kullkidb"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Generador de sesión de base de datos para inyección de dependencia en FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
