import sys
import os

# Ajustar el path para importar los módulos del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
import bcrypt
import pyotp

def seed():
    # Asegurarnos de que las tablas existan
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Crear Permisos Básicos
        permisos_data = [
            {"codigo": "acceso_total", "descripcion": "Acceso a todo el sistema y áreas"},
            {"codigo": "acceso_boveda", "descripcion": "Acceso a la Bóveda Principal"},
            {"codigo": "acceso_cajas", "descripcion": "Acceso al Área de Cajas"},
            {"codigo": "ver_reportes", "descripcion": "Ver reportes de accesos"},
            {"codigo": "gestionar_usuarios", "descripcion": "Crear y editar empleados"},
        ]
        
        permisos_db = {}
        for p in permisos_data:
            perm = db.query(models.Permiso).filter(models.Permiso.codigo_permiso == p["codigo"]).first()
            if not perm:
                perm = models.Permiso(codigo_permiso=p["codigo"], descripcion=p["descripcion"])
                db.add(perm)
                db.commit()
                db.refresh(perm)
            permisos_db[p["codigo"]] = perm

        # 2. Crear Roles si no existen
        rol_admin = db.query(models.Rol).filter(models.Rol.nombre == "admin").first()
        if not rol_admin:
            rol_admin = models.Rol(nombre="admin", descripcion="Administrador del sistema")
            rol_admin.permisos.append(permisos_db["acceso_total"])
            rol_admin.permisos.append(permisos_db["gestionar_usuarios"])
            db.add(rol_admin)
            
        rol_empleado = db.query(models.Rol).filter(models.Rol.nombre == "empleado").first()
        if not rol_empleado:
            rol_empleado = models.Rol(nombre="empleado", descripcion="Usuario regular (Cajero)")
            rol_empleado.permisos.append(permisos_db["acceso_cajas"])
            db.add(rol_empleado)
            
        db.commit()
        db.refresh(rol_admin)
        db.refresh(rol_empleado)

        # 3. Crear Agencia si no existe
        agencia = db.query(models.Agencia).filter(models.Agencia.nombre == "MAT").first()
        if not agencia:
            agencia = models.Agencia(nombre="MAT", direccion="Matriz Principal", estado=True)
            db.add(agencia)
            db.commit()
            db.refresh(agencia)

        # 4. Crear Usuarios
        admin_pwd_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        empleado_pwd_hash = bcrypt.hashpw("empleado123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_totp = pyotp.random_base32()
        comun_totp = pyotp.random_base32()

        # Administrador
        admin = db.query(models.Empleado).filter(models.Empleado.identificacion == "0987654321").first()
        if not admin:
            admin = models.Empleado(
                identificacion="0987654321",
                nombres="Carlos",
                apellidos="Admin",
                email="carlos.admin@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=admin_pwd_hash,
                totp_secret=admin_totp,
                estado_laboral="ACTIVO"
            )
            admin.roles.append(rol_admin)
            db.add(admin)

        # Usuario Común
        comun = db.query(models.Empleado).filter(models.Empleado.identificacion == "1712345678").first()
        if not comun:
            comun = models.Empleado(
                identificacion="1712345678",
                nombres="Maria",
                apellidos="Empleado",
                email="maria.empleado@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=empleado_pwd_hash,
                totp_secret=comun_totp,
                estado_laboral="ACTIVO"
            )
            comun.roles.append(rol_empleado)
            db.add(comun)

        db.commit()
        print("¡Base de datos poblada con éxito con RBAC Dinámico y TOTP!")
        print("--- Credenciales de Prueba ---")
        print(f"Administrador -> Cédula: 0987654321 | Pass: admin123 | TOTP Secret: {admin_totp}")
        print(f"Empleado      -> Cédula: 1712345678 | Pass: empleado123 | TOTP Secret: {comun_totp}")
        print("Para generar tu código de 6 dígitos QR en pruebas, usa el TOTP Secret en un autenticador (o código Python con pyotp).")

    except Exception as e:
        print(f"Error al poblar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
