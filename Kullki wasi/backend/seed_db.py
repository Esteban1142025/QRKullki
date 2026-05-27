import sys
import os

# Ajustar el path para importar los módulos del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
import bcrypt

def seed():
    # Asegurarnos de que las tablas existan
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Crear Roles si no existen
        rol_admin = db.query(models.Rol).filter(models.Rol.nombre == "admin").first()
        if not rol_admin:
            rol_admin = models.Rol(nombre="admin", descripcion="Administrador del sistema")
            db.add(rol_admin)
            
        rol_empleado = db.query(models.Rol).filter(models.Rol.nombre == "empleado").first()
        if not rol_empleado:
            rol_empleado = models.Rol(nombre="empleado", descripcion="Usuario regular")
            db.add(rol_empleado)
            
        db.commit()
        db.refresh(rol_admin)
        db.refresh(rol_empleado)

        # 2. Crear Agencia si no existe
        agencia = db.query(models.Agencia).filter(models.Agencia.nombre == "MAT").first()
        if not agencia:
            agencia = models.Agencia(nombre="MAT", direccion="Matriz Principal", estado=True)
            db.add(agencia)
            db.commit()
            db.refresh(agencia)

        # 3. Crear Usuarios
        pwd_hash = bcrypt.hashpw("kullki123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Administrador
        admin = db.query(models.Empleado).filter(models.Empleado.identificacion == "0000000000").first()
        if not admin:
            admin = models.Empleado(
                identificacion="0000000000",
                nombres="Super",
                apellidos="Administrador",
                id_rol=rol_admin.id_rol,
                id_agencia_base=agencia.id_agencia,
                password_hash=pwd_hash,
                token_qr="KULLKIWASI-ADMIN-0000000000-00",
                estado_laboral="ACTIVO"
            )
            db.add(admin)

        # Usuario Común
        comun = db.query(models.Empleado).filter(models.Empleado.identificacion == "1111111111").first()
        if not comun:
            comun = models.Empleado(
                identificacion="1111111111",
                nombres="Empleado",
                apellidos="Prueba",
                id_rol=rol_empleado.id_rol,
                id_agencia_base=agencia.id_agencia,
                password_hash=pwd_hash,
                token_qr="KULLKIWASI-EMPLEADO-1111111111-11",
                estado_laboral="ACTIVO"
            )
            db.add(comun)

        db.commit()
        print("¡Usuarios creados con éxito!")
        print("Administrador -> DNI: 0000000000, Pass: kullki123")
        print("Empleado      -> DNI: 1111111111, Pass: kullki123")

    except Exception as e:
        print(f"Error al poblar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
