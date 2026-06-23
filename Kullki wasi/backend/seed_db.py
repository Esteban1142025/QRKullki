import sys
import os

# Ajustar el path para importar los módulos del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
import bcrypt


def hash_password(plain: str) -> str:
    """Genera un hash bcrypt a partir de una contraseña en texto plano."""
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def is_bcrypt_hash(value: str) -> bool:
    """Verifica si un string ya es un hash bcrypt válido ($2b$, $2a$, $2y$)."""
    if not value:
        return False
    return value.startswith(('$2b$', '$2a$', '$2y$')) and len(value) >= 59


def upsert_permiso(db, codigo, descripcion):
    """Crea un permiso si no existe; si existe, lo retorna."""
    perm = db.query(models.Permiso).filter(
        models.Permiso.codigo_permiso == codigo
    ).first()
    if not perm:
        perm = models.Permiso(codigo_permiso=codigo, descripcion=descripcion)
        db.add(perm)
        db.flush()
        print(f"  [+] Permiso creado: {codigo}")
    return perm


def upsert_rol(db, nombre, descripcion, permisos_list):
    """Crea un rol si no existe y le asigna permisos. Si existe, lo retorna."""
    rol = db.query(models.Rol).filter(models.Rol.nombre == nombre).first()
    if not rol:
        rol = models.Rol(nombre=nombre, descripcion=descripcion)
        for p in permisos_list:
            rol.permisos.append(p)
        db.add(rol)
        db.flush()
        print(f"  [+] Rol creado: {nombre}")
    return rol


def upsert_agencia(db, nombre, codigo, direccion, telefono=None, tipo="Sucursal"):
    """Crea o actualiza una agencia por su código o nombre."""
    agencia = db.query(models.Agencia).filter(
        models.Agencia.codigo == codigo
    ).first()
    if not agencia:
        # Buscar por el nombre completo o por el código usado como nombre (ej: 'MAT' en el SQL de inicio)
        agencia = db.query(models.Agencia).filter(
            (models.Agencia.nombre == nombre) | (models.Agencia.nombre == codigo)
        ).first()

    if agencia:
        # Actualizar campos
        agencia.nombre = nombre  # Asegurar que tenga el nombre completo ("Matriz Ambato" en vez de "MAT")
        if not agencia.codigo:
            agencia.codigo = codigo
        if not agencia.direccion or agencia.direccion == 'Matriz Principal':
            agencia.direccion = direccion
        if not agencia.telefono and telefono:
            agencia.telefono = telefono
        if not agencia.tipo or agencia.tipo == 'Sucursal':
            agencia.tipo = tipo
        db.flush()
    else:
        agencia = models.Agencia(
            nombre=nombre, codigo=codigo, direccion=direccion,
            telefono=telefono, tipo=tipo, estado=True
        )
        db.add(agencia)
        db.flush()
        print(f"  [+] Agencia creada: {nombre} ({codigo})")
    return agencia


def upsert_empleado(db, identificacion, nombres, apellidos, email,
                    agencia, password_plain, rol, departamento=None):
    """
    Crea un empleado si no existe.
    Si ya existe, SIEMPRE actualiza el password_hash a bcrypt para
    corregir contraseñas en texto plano insertadas por el SQL inicial.
    También asegura que el rol y la agencia estén correctamente asignados.
    """
    emp = db.query(models.Empleado).filter(
        models.Empleado.identificacion == identificacion
    ).first()

    new_hash = hash_password(password_plain)

    if emp:
        # --- Corregir password si está en texto plano o falta ---
        if not emp.password_hash or not is_bcrypt_hash(emp.password_hash):
            emp.password_hash = new_hash
            print(f"  [~] Password actualizado (bcrypt): {identificacion} ({nombres} {apellidos})")
        # --- Asegurar que tiene el rol correcto ---
        if rol not in emp.roles:
            emp.roles.append(rol)
            print(f"  [~] Rol '{rol.nombre}' asignado a: {identificacion}")
        # --- Asegurar agencia ---
        if not emp.id_agencia_base and agencia:
            emp.id_agencia_base = agencia.id_agencia
        # --- Asegurar departamento ---
        if not emp.departamento and departamento:
            emp.departamento = departamento
        db.flush()
    else:
        emp = models.Empleado(
            identificacion=identificacion,
            nombres=nombres,
            apellidos=apellidos,
            email=email,
            id_agencia_base=agencia.id_agencia if agencia else None,
            password_hash=new_hash,
            estado_laboral="ACTIVO",
            departamento=departamento,
        )
        emp.roles.append(rol)
        db.add(emp)
        db.flush()
        print(f"  [+] Empleado creado: {identificacion} ({nombres} {apellidos}) -> rol: {rol.nombre}")

    return emp


def seed():
    """Poblar la base de datos con datos iniciales de prueba.

    Este script es IDEMPOTENTE: puede ejecutarse múltiples veces sin
    duplicar datos. Si los usuarios ya existen (creados por el SQL
    de inicialización), actualiza sus contraseñas a hashes bcrypt
    válidos para que el login funcione correctamente.
    """

    # Asegurarnos de que las tablas existan
    models.Base.metadata.create_all(bind=engine)

    # Migración de emergencia: asegurar que la columna 'codigo' exista en 'agencias'
    # en caso de que el desarrollador tenga un volumen persistente antiguo de la base de datos.
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE agencias ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);"))
            print("  [~] Verificación de esquema: columna 'codigo' en 'agencias' asegurada.")
    except Exception as e:
        print(f"  [!] Advertencia al verificar/crear la columna 'codigo' en la tabla 'agencias': {e}")

    db = SessionLocal()

    try:
        print("=" * 60)
        print("  SEED: Inicializando base de datos Kullki Wasi")
        print("=" * 60)

        # ──────────────────────────────────────────────────────────
        # 1. PERMISOS
        # ──────────────────────────────────────────────────────────
        print("\n[1/5] Creando permisos...")
        permisos_data = [
            ("acceso_total",       "Acceso a todo el sistema y áreas"),
            ("acceso_boveda",      "Acceso a la Bóveda Principal"),
            ("acceso_cajas",       "Acceso al Área de Cajas"),
            ("ver_reportes",       "Ver reportes de accesos"),
            ("gestionar_usuarios", "Crear y editar empleados"),
        ]
        permisos = {}
        for codigo, desc in permisos_data:
            permisos[codigo] = upsert_permiso(db, codigo, desc)
        db.commit()

        # ──────────────────────────────────────────────────────────
        # 2. ROLES
        # ──────────────────────────────────────────────────────────
        print("\n[2/5] Creando roles...")
        roles_config = [
            ("admin",            "Administrador del sistema",  [permisos["acceso_total"], permisos["gestionar_usuarios"]]),
            ("empleado",         "Usuario regular (Cajero)",   [permisos["acceso_cajas"]]),
            ("talento_humano",   "Gestión de talento humano",  [permisos["gestionar_usuarios"]]),
            ("riesgos",          "Oficial de riesgos",         [permisos["acceso_boveda"], permisos["ver_reportes"]]),
            ("seguridad_fisica", "Seguridad física",           [permisos["acceso_boveda"], permisos["ver_reportes"]]),
            ("auditor",          "Auditor interno",            [permisos["ver_reportes"]]),
            ("jefe_agencia",     "Jefe de agencia",            [permisos["acceso_cajas"]]),
            ("tecnico_ti",       "Técnico de TI",              [permisos["ver_reportes"]]),
        ]
        roles = {}
        for nombre, desc, perms in roles_config:
            roles[nombre] = upsert_rol(db, nombre, desc, perms)
        db.commit()

        # ──────────────────────────────────────────────────────────
        # 3. AGENCIAS
        # ──────────────────────────────────────────────────────────
        print("\n[3/5] Creando agencias...")
        agencias_data = [
            ("Matriz Ambato",         "MAT", "Av. Juan Benigno Vela y Martínez, Ambato", "032-824-567", "Principal"),
            ("Agencia Pelileo",       "PEL", "Calle Padre Jorge y Av. Confraternidad, Pelileo", "032-871-234", "Sucursal"),
            ("Agencia Píllaro",       "PIL", "Calle Sucre y Bolívar, Píllaro",                  "032-873-456", "Sucursal"),
            ("Agencia Baños",         "BAN", "Calle Ambato y Thomas Halflants, Baños",           "032-740-123", "Sucursal"),
            ("Agencia Salcedo",       "SAL", "Calle Sucre y 24 de Mayo, Salcedo",                "032-726-789", "Sucursal"),
            ("Agencia Quisapincha",   "QUI", "Vía principal, Quisapincha",                       "032-841-567", "Extensión"),
        ]
        agencias = {}
        for nombre, codigo, dir, tel, tipo in agencias_data:
            agencias[codigo] = upsert_agencia(db, nombre, codigo, dir, tel, tipo)
        db.commit()

        # ──────────────────────────────────────────────────────────
        # 4. USUARIOS DE PRUEBA (Matriz)
        # ──────────────────────────────────────────────────────────
        print("\n[4/5] Creando/actualizando usuarios de prueba...")
        usuarios_matriz = [
            # (cédula,       nombres,   apellidos,  email,                             password,       rol)
            ("0987654321", "Carlos",   "Ruiz",     "carlos.ruiz@kullkiwasi.com",       "admin123",      "admin"),
            ("1712345678", "Maria",    "Garcia",   "maria.garcia@kullkiwasi.com",      "empleado123",   "empleado"),
            ("1234567890", "Juan",     "Pérez",    "juan.perez@kullkiwasi.com",        "talento123",    "talento_humano"),
            ("2345678901", "Ana",      "López",    "ana.lopez@kullkiwasi.com",         "riesgos123",    "riesgos"),
            ("3456789012", "Carlos",   "Mendoza",  "carlos.mendoza@kullkiwasi.com",    "seguridad123",  "seguridad_fisica"),
            ("4567890123", "María",    "Torres",   "maria.torres@kullkiwasi.com",      "auditor123",    "auditor"),
            ("5678901234", "Roberto",  "Sánchez",  "roberto.sanchez@kullkiwasi.com",   "jefe123",       "jefe_agencia"),
            ("6789012345", "Luis",     "Ramírez",  "luis.ramirez@kullkiwasi.com",      "tecnico123",    "tecnico_ti"),
        ]

        for cedula, nombres, apellidos, email, pwd, rol_nombre in usuarios_matriz:
            upsert_empleado(
                db, cedula, nombres, apellidos, email,
                agencias["MAT"], pwd, roles[rol_nombre]
            )
        db.commit()

        # ──────────────────────────────────────────────────────────
        # 5. ADMINISTRADORES POR AGENCIA
        # ──────────────────────────────────────────────────────────
        print("\n[5/5] Creando/actualizando administradores por agencia...")
        admins_agencia = [
            ("1800000001", "Diego",    "Martínez", "admin.pelileo@kullkiwasi.fin.ec",     "Admin2024.", "PEL"),
            ("1800000002", "Lucía",    "Herrera",  "admin.pillaro@kullkiwasi.fin.ec",     "Admin2024.", "PIL"),
            ("1800000003", "Andrés",   "Vásquez",  "admin.banos@kullkiwasi.fin.ec",       "Admin2024.", "BAN"),
            ("1800000004", "Paola",    "Cevallos", "admin.salcedo@kullkiwasi.fin.ec",     "Admin2024.", "SAL"),
            ("1800000005", "Fernando", "Ortiz",    "admin.quisapincha@kullkiwasi.fin.ec", "Admin2024.", "QUI"),
        ]

        for cedula, nombres, apellidos, email, pwd, ag_codigo in admins_agencia:
            upsert_empleado(
                db, cedula, nombres, apellidos, email,
                agencias[ag_codigo], pwd, roles["admin"],
                departamento="Administración"
            )
        db.commit()

        # ──────────────────────────────────────────────────────────
        # RESUMEN
        # ──────────────────────────────────────────────────────────
        total_empleados = db.query(models.Empleado).count()
        total_agencias  = db.query(models.Agencia).count()
        total_roles     = db.query(models.Rol).count()

        print("\n" + "=" * 60)
        print("  ✓ Base de datos poblada con éxito")
        print(f"    Empleados: {total_empleados}  |  Agencias: {total_agencias}  |  Roles: {total_roles}")
        print("=" * 60)
        print("\n--- Credenciales de Prueba (Matriz) ---")
        print("Administrador    -> Cédula: 0987654321   | Pass: admin123")
        print("Empleado         -> Cédula: 1712345678   | Pass: empleado123")
        print("Talento Humano   -> Cédula: 1234567890   | Pass: talento123")
        print("Oficial Riesgos  -> Cédula: 2345678901   | Pass: riesgos123")
        print("Seguridad Física -> Cédula: 3456789012   | Pass: seguridad123")
        print("Auditor Interno  -> Cédula: 4567890123   | Pass: auditor123")
        print("Jefe de Agencia  -> Cédula: 5678901234   | Pass: jefe123")
        print("Técnico TI       -> Cédula: 6789012345   | Pass: tecnico123")
        print("\n--- Admins por Agencia (pass: Admin2024.) ---")
        print("Pelileo          -> Cédula: 1800000001")
        print("Píllaro          -> Cédula: 1800000002")
        print("Baños            -> Cédula: 1800000003")
        print("Salcedo          -> Cédula: 1800000004")
        print("Quisapincha      -> Cédula: 1800000005")

    except Exception as e:
        print(f"\n[ERROR] Error al poblar la base de datos: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
