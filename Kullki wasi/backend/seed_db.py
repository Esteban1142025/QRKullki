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

        rol_talento_humano = db.query(models.Rol).filter(models.Rol.nombre == "talento_humano").first()
        if not rol_talento_humano:
            rol_talento_humano = models.Rol(nombre="talento_humano", descripcion="Gestión de talento humano")
            rol_talento_humano.permisos.append(permisos_db["gestionar_usuarios"])
            db.add(rol_talento_humano)

        rol_riesgos = db.query(models.Rol).filter(models.Rol.nombre == "riesgos").first()
        if not rol_riesgos:
            rol_riesgos = models.Rol(nombre="riesgos", descripcion="Oficial de riesgos")
            rol_riesgos.permisos.append(permisos_db["acceso_boveda"])
            rol_riesgos.permisos.append(permisos_db["ver_reportes"])
            db.add(rol_riesgos)

        rol_seguridad_fisica = db.query(models.Rol).filter(models.Rol.nombre == "seguridad_fisica").first()
        if not rol_seguridad_fisica:
            rol_seguridad_fisica = models.Rol(nombre="seguridad_fisica", descripcion="Seguridad física")
            rol_seguridad_fisica.permisos.append(permisos_db["acceso_boveda"])
            rol_seguridad_fisica.permisos.append(permisos_db["ver_reportes"])
            db.add(rol_seguridad_fisica)

        rol_auditor = db.query(models.Rol).filter(models.Rol.nombre == "auditor").first()
        if not rol_auditor:
            rol_auditor = models.Rol(nombre="auditor", descripcion="Auditor interno")
            rol_auditor.permisos.append(permisos_db["ver_reportes"])
            db.add(rol_auditor)

        rol_jefe_agencia = db.query(models.Rol).filter(models.Rol.nombre == "jefe_agencia").first()
        if not rol_jefe_agencia:
            rol_jefe_agencia = models.Rol(nombre="jefe_agencia", descripcion="Jefe de agencia")
            rol_jefe_agencia.permisos.append(permisos_db["acceso_cajas"])
            db.add(rol_jefe_agencia)

        rol_tecnico_ti = db.query(models.Rol).filter(models.Rol.nombre == "tecnico_ti").first()
        if not rol_tecnico_ti:
            rol_tecnico_ti = models.Rol(nombre="tecnico_ti", descripcion="Técnico de TI")
            rol_tecnico_ti.permisos.append(permisos_db["ver_reportes"])
            db.add(rol_tecnico_ti)
            
        db.commit()
        db.refresh(rol_admin)
        db.refresh(rol_empleado)
        db.refresh(rol_talento_humano)
        db.refresh(rol_riesgos)
        db.refresh(rol_seguridad_fisica)
        db.refresh(rol_auditor)
        db.refresh(rol_jefe_agencia)
        db.refresh(rol_tecnico_ti)

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
        talento_pwd_hash = bcrypt.hashpw("talento123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        riesgos_pwd_hash = bcrypt.hashpw("riesgos123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        seguridad_pwd_hash = bcrypt.hashpw("seguridad123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        auditor_pwd_hash = bcrypt.hashpw("auditor123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        jefe_pwd_hash = bcrypt.hashpw("jefe123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        tecnico_pwd_hash = bcrypt.hashpw("tecnico123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Administrador
        admin = db.query(models.Empleado).filter(models.Empleado.identificacion == "0987654321").first()
        if not admin:
            admin = models.Empleado(
                identificacion="0987654321",
                nombres="Carlos",
                apellidos="Ruiz",
                email="carlos.ruiz@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=admin_pwd_hash,
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
                apellidos="Garcia",
                email="maria.garcia@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=empleado_pwd_hash,
                estado_laboral="ACTIVO"
            )
            comun.roles.append(rol_empleado)
            db.add(comun)

        # Talento Humano
        talento = db.query(models.Empleado).filter(models.Empleado.identificacion == "1234567890").first()
        if not talento:
            talento = models.Empleado(
                identificacion="1234567890",
                nombres="Juan",
                apellidos="Pérez",
                email="juan.perez@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=talento_pwd_hash,
                estado_laboral="ACTIVO"
            )
            talento.roles.append(rol_talento_humano)
            db.add(talento)

        # Riesgos
        riesgos = db.query(models.Empleado).filter(models.Empleado.identificacion == "2345678901").first()
        if not riesgos:
            riesgos = models.Empleado(
                identificacion="2345678901",
                nombres="Ana",
                apellidos="López",
                email="ana.lopez@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=riesgos_pwd_hash,
                estado_laboral="ACTIVO"
            )
            riesgos.roles.append(rol_riesgos)
            db.add(riesgos)

        # Seguridad Física
        seguridad = db.query(models.Empleado).filter(models.Empleado.identificacion == "3456789012").first()
        if not seguridad:
            seguridad = models.Empleado(
                identificacion="3456789012",
                nombres="Carlos",
                apellidos="Mendoza",
                email="carlos.mendoza@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=seguridad_pwd_hash,
                estado_laboral="ACTIVO"
            )
            seguridad.roles.append(rol_seguridad_fisica)
            db.add(seguridad)

        # Auditor
        auditor = db.query(models.Empleado).filter(models.Empleado.identificacion == "4567890123").first()
        if not auditor:
            auditor = models.Empleado(
                identificacion="4567890123",
                nombres="María",
                apellidos="Torres",
                email="maria.torres@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=auditor_pwd_hash,
                estado_laboral="ACTIVO"
            )
            auditor.roles.append(rol_auditor)
            db.add(auditor)

        # Jefe de Agencia
        jefe = db.query(models.Empleado).filter(models.Empleado.identificacion == "5678901234").first()
        if not jefe:
            jefe = models.Empleado(
                identificacion="5678901234",
                nombres="Roberto",
                apellidos="Sánchez",
                email="roberto.sanchez@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=jefe_pwd_hash,
                estado_laboral="ACTIVO"
            )
            jefe.roles.append(rol_jefe_agencia)
            db.add(jefe)

        # Técnico TI
        tecnico = db.query(models.Empleado).filter(models.Empleado.identificacion == "6789012345").first()
        if not tecnico:
            tecnico = models.Empleado(
                identificacion="6789012345",
                nombres="Luis",
                apellidos="Ramírez",
                email="luis.ramirez@kullkiwasi.com",
                id_agencia_base=agencia.id_agencia,
                password_hash=tecnico_pwd_hash,
                estado_laboral="ACTIVO"
            )
            tecnico.roles.append(rol_tecnico_ti)
            db.add(tecnico)

        db.commit()
        print("Base de datos poblada con exito.")
        print("--- Credenciales de Prueba ---")
        print("Administrador    -> Cedula: 0987654321   | Pass: admin123")
        print("Empleado         -> Cedula: 1712345678   | Pass: empleado123")
        print("Talento Humano   -> Cedula: 1234567890   | Pass: talento123")
        print("Oficial Riesgos  -> Cedula: 2345678901   | Pass: riesgos123")
        print("Seguridad Fisica -> Cedula: 3456789012   | Pass: seguridad123")
        print("Auditor Interno  -> Cedula: 4567890123   | Pass: auditor123")
        print("Jefe de Agencia  -> Cedula: 5678901234   | Pass: jefe123")
        print("Tecnico TI       -> Cedula: 6789012345   | Pass: tecnico123")

    except Exception as e:
        print(f"Error al poblar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
