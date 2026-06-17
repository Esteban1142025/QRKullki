from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text as sa_text
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional
import database
import models
import datetime
import bcrypt
import jwt

# Convierte un datetime naive (guardado en UTC) a string ISO 8601 con sufijo Z
# para que JavaScript lo interprete correctamente como UTC y muestre la hora local del cliente
def utc_iso(dt):
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"

SECRET_KEY = "kullki-wasi-super-secret-jwt-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

ROLE_DEPARTMENTS = {
    "admin": "Administración General",
    "talento_humano": "Talento Humano",
    "riesgos": "Gestión de Riesgos",
    "seguridad_fisica": "Seguridad y Vigilancia",
    "auditor": "Auditoría Interna",
    "jefe_agencia": "Operaciones Financieras",
    "tecnico_ti": "Tecnología e Información",
    "empleado": "Caja y Servicios",
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if hashed_password == plain_password:
        return True
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def format_empleado(e):
    role_name = e.roles[0].nombre if e.roles else "empleado"
    agencia_codigo = "MAT"
    agencia_nombre = "Matriz Ambato"
    if e.agencia_base:
        agencia_codigo = e.agencia_base.codigo or "MAT"
        agencia_nombre = e.agencia_base.nombre or "Matriz Ambato"
    dept = e.departamento or ROLE_DEPARTMENTS.get(role_name, "General")
    return {
        "id": f"KW-{e.id_empleado:03d}",
        "id_empleado": e.id_empleado,
        "dni": e.identificacion,
        "name": f"{e.nombres} {e.apellidos}",
        "role": role_name,
        "department": dept,
        "agency": agencia_codigo,
        "agencyName": agencia_nombre,
        "email": e.email or "",
        "status": "Activo" if e.estado_laboral == "ACTIVO" else "Inactivo",
        "hireDate": e.creado_en.strftime("%Y-%m-%d") if e.creado_en else "",
        "qrCode": f"KULLKIWASI-{role_name.upper()}-{e.identificacion}-{e.id_empleado:03d}",
        "phone": "",
    }

def format_agencia(a):
    return {
        "id": a.codigo or f"AG-{a.id_agencia}",
        "id_agencia": a.id_agencia,
        "name": a.nombre,
        "address": a.direccion or "",
        "phone": a.telefono or "",
        "type": a.tipo or "Sucursal",
        "status": "Activo" if a.estado else "Inactivo",
    }

app = FastAPI(
    title="Sistema de Accesos y Trazabilidad Kullki Wasi",
    description="REST API para control de accesos SEPS con JWT",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Evita que el servidor crashee, devolviendo un 500 controlado
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor", "message": str(exc)},
    )

@app.on_event("startup")
def startup_event():
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Tablas de Base de Datos inicializadas.")
    except Exception as e:
        print(f"Advertencia: No se pudo conectar a la Base de Datos. Detalle: {e}")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas ---

class LoginRequest(BaseModel):
    cedula: str
    password: str

    @field_validator('cedula')
    @classmethod
    def validate_cedula(cls, v):
        if not v.isdigit():
            raise ValueError('La cédula debe contener solo números')
        if len(v) != 10:
            raise ValueError('La cédula debe tener exactamente 10 dígitos')
        return v

class EmpleadoCreate(BaseModel):
    identificacion: str
    nombres: str
    apellidos: str
    email: Optional[str] = None
    id_agencia_base: Optional[int] = None
    departamento: Optional[str] = None
    estado_laboral: str = "ACTIVO"
    role_ids: List[int] = []

class AgenciaCreate(BaseModel):
    nombre: str
    codigo: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    tipo: str = "Sucursal"
    estado: bool = True

class AreaUpdate(BaseModel):
    nivel_riesgo: Optional[str] = None
    horario: Optional[str] = None

# --- Auth ---

@app.post("/api/v1/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(
        models.Empleado.identificacion == req.cedula
    ).first()
    if not emp:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    if emp.estado_laboral != "ACTIVO":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    if not emp.password_hash or not verify_password(req.password, emp.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    roles = [r.nombre for r in emp.roles]
    permisos = []
    for r in emp.roles:
        for p in r.permisos:
            permisos.append(p.codigo_permiso)

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": emp.identificacion, "roles": roles, "permisos": list(set(permisos))},
        expires_delta=access_token_expires
    )
    rol_principal = roles[0] if roles else "empleado"
    agencia_codigo = "MAT"
    agencia_nombre = "Casa Matriz — Ambato"
    if emp.agencia_base:
        agencia_codigo = emp.agencia_base.codigo or "MAT"
        agencia_nombre = emp.agencia_base.nombre or "Casa Matriz — Ambato"

    return {
        "token": access_token,
        "user": {
            "id": f"KW-{emp.id_empleado:03d}",
            "dni": emp.identificacion,
            "name": f"{emp.nombres} {emp.apellidos}",
            "email": emp.email,
            "role": rol_principal,
            "permissions": list(set(permisos)),
            "roleName": rol_principal.replace("_", " ").title(),
            "agency": agencia_codigo,
            "agencyName": agencia_nombre,
            "status": emp.estado_laboral
        }
    }

class ProfileUpdate(BaseModel):
    nombres: str
    apellidos: str
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@app.patch("/api/v1/auth/profile/{cedula}")
def update_profile(cedula: str, data: ProfileUpdate, db: Session = Depends(get_db)):
    """Actualiza nombre, correo y/o contraseña del usuario autenticado."""
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == cedula).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    # Verificar contraseña actual si se quiere cambiar la contraseña
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Debes ingresar tu contraseña actual para cambiarla")
        if not verify_password(data.current_password, emp.password_hash or ""):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
        emp.password_hash = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    # Verificar email duplicado
    if data.email and data.email != emp.email:
        dup = db.query(models.Empleado).filter(
            models.Empleado.email == data.email,
            models.Empleado.id_empleado != emp.id_empleado
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Ese correo ya está en uso por otro colaborador")
    emp.nombres = data.nombres
    emp.apellidos = data.apellidos
    if data.email:
        emp.email = data.email
    db.commit()
    db.refresh(emp)
    return {
        "id": f"KW-{emp.id_empleado:03d}",
        "name": f"{emp.nombres} {emp.apellidos}",
        "email": emp.email,
        "dni": emp.identificacion,
    }

# --- Backup / Restore ---

@app.get("/api/v1/backup")
def exportar_backup(db: Session = Depends(get_db)):
    """Exporta toda la BD a JSON para respaldo."""
    import json

    agencias = db.query(models.Agencia).all()
    roles = db.query(models.Rol).all()
    permisos = db.query(models.Permiso).all()
    empleados = db.query(models.Empleado).all()
    areas = db.query(models.AreaRestringida).all()
    dispositivos = db.query(models.DispositivoEscaneo).all()
    bitacora = db.query(models.BitacoraAcceso).order_by(models.BitacoraAcceso.fecha_hora.desc()).limit(500).all()
    alertas = db.query(models.AlertaSeguridad).order_by(models.AlertaSeguridad.fecha_generacion.desc()).limit(500).all()
    roles_permisos_rows = db.execute(models.roles_permisos.select()).fetchall()

    backup = {
        "version": "1.0",
        "generado_en": datetime.datetime.utcnow().isoformat() + "Z",
        "agencias": [{"id_agencia": a.id_agencia, "nombre": a.nombre, "codigo": a.codigo, "direccion": a.direccion, "telefono": a.telefono, "tipo": a.tipo, "estado": a.estado} for a in agencias],
        "permisos": [{"id_permiso": p.id_permiso, "codigo_permiso": p.codigo_permiso, "descripcion": p.descripcion} for p in permisos],
        "roles": [{"id_rol": r.id_rol, "nombre": r.nombre, "descripcion": r.descripcion, "activo": r.activo} for r in roles],
        "roles_permisos": [{"id_rol": row[0], "id_permiso": row[1]} for row in roles_permisos_rows],
        "empleados": [{"id_empleado": e.id_empleado, "identificacion": e.identificacion, "nombres": e.nombres, "apellidos": e.apellidos, "email": e.email, "password_hash": e.password_hash, "estado_laboral": e.estado_laboral, "departamento": e.departamento, "id_agencia_base": e.id_agencia_base, "creado_en": e.creado_en.isoformat() if e.creado_en else None, "roles": [r.id_rol for r in e.roles]} for e in empleados],
        "areas_restringidas": [{"id_area": a.id_area, "id_agencia": a.id_agencia, "nombre": a.nombre, "nivel_riesgo": a.nivel_riesgo, "id_permiso_requerido": a.id_permiso_requerido, "estado": a.estado, "horario": a.horario} for a in areas],
        "dispositivos": [{"id_dispositivo": d.id_dispositivo, "id_area": d.id_area, "identificador_equipo": d.identificador_equipo, "mac_address": d.mac_address, "ip_address": d.ip_address, "estado": d.estado} for d in dispositivos],
        "bitacora": [{"id_bitacora": b.id_bitacora, "id_empleado": b.id_empleado, "id_area": b.id_area, "id_dispositivo": b.id_dispositivo, "fecha_hora": utc_iso(b.fecha_hora), "tipo_movimiento": b.tipo_movimiento, "resultado": b.resultado, "motivo": b.motivo} for b in bitacora],
        "alertas": [{"id_alerta": a.id_alerta, "id_bitacora_asociada": a.id_bitacora_asociada, "tipo_alerta": a.tipo_alerta, "estado": a.estado, "fecha_generacion": utc_iso(a.fecha_generacion)} for a in alertas],
    }
    from fastapi.responses import JSONResponse
    return JSONResponse(content=backup, headers={"Content-Disposition": f"attachment; filename=backup_kullki_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"})

@app.post("/api/v1/restore")
async def restaurar_backup(db: Session = Depends(get_db), file: bytes = None):
    """Restaura la BD desde un archivo JSON de respaldo."""
    from fastapi import UploadFile, File
    return {"error": "use multipart endpoint"}

from fastapi import UploadFile, File

@app.post("/api/v1/restore/upload")
async def restaurar_backup_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Recibe un archivo JSON de respaldo y restaura los datos."""
    import json
    try:
        content = await file.read()
        data = json.loads(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Archivo JSON inválido o corrupto")

    if data.get("version") != "1.0":
        raise HTTPException(status_code=400, detail="Versión de respaldo no compatible")

    try:
        # --- Limpiar en orden inverso de dependencias ---
        db.execute(models.roles_permisos.delete())
        db.query(models.AlertaSeguridad).delete()
        db.query(models.BitacoraAcceso).delete()
        db.query(models.DispositivoEscaneo).delete()
        db.query(models.EmpleadoArea).delete()
        for e in db.query(models.Empleado).all():
            e.roles = []
        db.flush()
        db.query(models.Empleado).delete()
        db.query(models.AreaRestringida).delete()
        db.query(models.Rol).delete()
        db.query(models.Permiso).delete()
        db.query(models.Agencia).delete()
        db.flush()

        # --- Restaurar en orden de dependencias ---
        for a in data.get("agencias", []):
            db.add(models.Agencia(id_agencia=a["id_agencia"], nombre=a["nombre"], codigo=a.get("codigo"), direccion=a.get("direccion"), telefono=a.get("telefono"), tipo=a.get("tipo","Sucursal"), estado=a.get("estado", True)))
        db.flush()

        for p in data.get("permisos", []):
            db.add(models.Permiso(id_permiso=p["id_permiso"], codigo_permiso=p["codigo_permiso"], descripcion=p.get("descripcion")))
        db.flush()

        for r in data.get("roles", []):
            db.add(models.Rol(id_rol=r["id_rol"], nombre=r["nombre"], descripcion=r.get("descripcion"), activo=r.get("activo", True)))
        db.flush()

        for rp in data.get("roles_permisos", []):
            db.execute(models.roles_permisos.insert().values(id_rol=rp["id_rol"], id_permiso=rp["id_permiso"]))
        db.flush()

        for e in data.get("empleados", []):
            emp = models.Empleado(
                id_empleado=e["id_empleado"], identificacion=e["identificacion"],
                nombres=e["nombres"], apellidos=e["apellidos"], email=e.get("email"),
                password_hash=e.get("password_hash"), estado_laboral=e.get("estado_laboral","ACTIVO"),
                departamento=e.get("departamento"), id_agencia_base=e.get("id_agencia_base"),
                creado_en=datetime.datetime.fromisoformat(e["creado_en"].replace("Z","")) if e.get("creado_en") else datetime.datetime.utcnow()
            )
            db.add(emp)
            db.flush()
            if e.get("roles"):
                roles_obj = db.query(models.Rol).filter(models.Rol.id_rol.in_(e["roles"])).all()
                emp.roles = roles_obj
        db.flush()

        for a in data.get("areas_restringidas", []):
            db.add(models.AreaRestringida(id_area=a["id_area"], id_agencia=a.get("id_agencia"), nombre=a["nombre"], nivel_riesgo=a["nivel_riesgo"], id_permiso_requerido=a.get("id_permiso_requerido"), estado=a.get("estado",True), horario=a.get("horario","08:00-18:00")))
        db.flush()

        for d in data.get("dispositivos", []):
            db.add(models.DispositivoEscaneo(id_dispositivo=d["id_dispositivo"], id_area=d.get("id_area"), identificador_equipo=d["identificador_equipo"], mac_address=d.get("mac_address"), ip_address=d.get("ip_address"), estado=d.get("estado",True)))
        db.flush()

        for b in data.get("bitacora", []):
            db.add(models.BitacoraAcceso(id_bitacora=b["id_bitacora"], id_empleado=b.get("id_empleado"), id_area=b.get("id_area"), id_dispositivo=b.get("id_dispositivo"), fecha_hora=datetime.datetime.fromisoformat(b["fecha_hora"].replace("Z","")) if b.get("fecha_hora") else datetime.datetime.utcnow(), tipo_movimiento=b.get("tipo_movimiento","IN"), resultado=b["resultado"], motivo=b.get("motivo")))
        db.flush()

        for al in data.get("alertas", []):
            db.add(models.AlertaSeguridad(id_alerta=al["id_alerta"], id_bitacora_asociada=al.get("id_bitacora_asociada"), tipo_alerta=al["tipo_alerta"], estado=al.get("estado","ABIERTA"), fecha_generacion=datetime.datetime.fromisoformat(al["fecha_generacion"].replace("Z","")) if al.get("fecha_generacion") else datetime.datetime.utcnow()))
        db.flush()

        db.commit()

        # Restablecer secuencias de autoincremento
        db.execute(sa_text("SELECT setval('agencias_id_agencia_seq', (SELECT MAX(id_agencia) FROM agencias))"))
        db.execute(sa_text("SELECT setval('permisos_id_permiso_seq', (SELECT MAX(id_permiso) FROM permisos))"))
        db.execute(sa_text("SELECT setval('roles_id_rol_seq', (SELECT MAX(id_rol) FROM roles))"))
        db.execute(sa_text("SELECT setval('empleados_id_empleado_seq', (SELECT MAX(id_empleado) FROM empleados))"))
        db.execute(sa_text("SELECT setval('areas_restringidas_id_area_seq', (SELECT MAX(id_area) FROM areas_restringidas))"))
        db.execute(sa_text("SELECT setval('dispositivos_escaneo_id_dispositivo_seq', (SELECT MAX(id_dispositivo) FROM dispositivos_escaneo))"))
        db.execute(sa_text("SELECT setval('bitacora_accesos_id_bitacora_seq', (SELECT MAX(id_bitacora) FROM bitacora_accesos))"))
        db.execute(sa_text("SELECT setval('alertas_seguridad_id_alerta_seq', (SELECT MAX(id_alerta) FROM alertas_seguridad))"))
        db.commit()

        return {"ok": True, "message": "Sistema restaurado correctamente"}
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error durante la restauración: {str(ex)}")

@app.get("/api/v1/auth/permissions/{cedula}")
def get_permissions_by_cedula(cedula: str, db: Session = Depends(get_db)):
    """Devuelve los permisos actualizados desde la BD para una cédula dada.
    El frontend lo llama después de que RBAC guarda cambios, para refrescar sin logout."""
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == cedula).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    permisos = []
    for r in emp.roles:
        for p in r.permisos:
            permisos.append(p.codigo_permiso)
    agencia_codigo = "MAT"
    agencia_nombre = "Casa Matriz — Ambato"
    if emp.agencia_base:
        agencia_codigo = emp.agencia_base.codigo or "MAT"
        agencia_nombre = emp.agencia_base.nombre or "Casa Matriz — Ambato"
    return {
        "permissions": list(set(permisos)),
        "agency": agencia_codigo,
        "agencyName": agencia_nombre,
    }

# --- Empleados ---

@app.get("/api/v1/empleados")
def listar_empleados(db: Session = Depends(get_db)):
    empleados = db.query(models.Empleado).all()
    return [format_empleado(e) for e in empleados]

@app.get("/api/v1/empleados/{id_empleado}")
def obtener_empleado(id_empleado: int, db: Session = Depends(get_db)):
    e = db.query(models.Empleado).filter(models.Empleado.id_empleado == id_empleado).first()
    if not e:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return format_empleado(e)

@app.post("/api/v1/empleados")
def crear_empleado(data: EmpleadoCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Empleado).filter(
        models.Empleado.identificacion == data.identificacion
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un empleado con esta cédula")
    if data.email:
        dup_email = db.query(models.Empleado).filter(models.Empleado.email == data.email).first()
        if dup_email:
            raise HTTPException(status_code=400, detail="Ya existe un empleado con este correo")

    e = models.Empleado(
        identificacion=data.identificacion,
        nombres=data.nombres,
        apellidos=data.apellidos,
        email=data.email,
        id_agencia_base=data.id_agencia_base,
        departamento=data.departamento,
        estado_laboral=data.estado_laboral,
    )
    if data.role_ids:
        roles = db.query(models.Rol).filter(models.Rol.id_rol.in_(data.role_ids)).all()
        e.roles = roles

    db.add(e)
    db.commit()
    db.refresh(e)
    return format_empleado(e)

@app.put("/api/v1/empleados/{id_empleado}")
def actualizar_empleado(id_empleado: int, data: EmpleadoCreate, db: Session = Depends(get_db)):
    e = db.query(models.Empleado).filter(models.Empleado.id_empleado == id_empleado).first()
    if not e:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    dup = db.query(models.Empleado).filter(
        models.Empleado.identificacion == data.identificacion,
        models.Empleado.id_empleado != id_empleado
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Ya existe otro empleado con esta cédula")
    if data.email:
        dup_email = db.query(models.Empleado).filter(
            models.Empleado.email == data.email,
            models.Empleado.id_empleado != id_empleado
        ).first()
        if dup_email:
            raise HTTPException(status_code=400, detail="Ya existe otro empleado con este correo")

    e.identificacion = data.identificacion
    e.nombres = data.nombres
    e.apellidos = data.apellidos
    e.email = data.email
    e.id_agencia_base = data.id_agencia_base
    e.departamento = data.departamento
    e.estado_laboral = data.estado_laboral
    if data.role_ids:
        roles = db.query(models.Rol).filter(models.Rol.id_rol.in_(data.role_ids)).all()
        e.roles = roles

    db.commit()
    db.refresh(e)
    return format_empleado(e)

@app.delete("/api/v1/empleados/{id_empleado}")
def eliminar_empleado(id_empleado: int, db: Session = Depends(get_db)):
    e = db.query(models.Empleado).filter(models.Empleado.id_empleado == id_empleado).first()
    if not e:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    db.delete(e)
    db.commit()
    return {"message": "Empleado eliminado"}

# --- Agencias ---

@app.get("/api/v1/agencias")
def listar_agencias(db: Session = Depends(get_db)):
    agencias = db.query(models.Agencia).all()
    return [format_agencia(a) for a in agencias]

@app.post("/api/v1/agencias")
def crear_agencia(data: AgenciaCreate, db: Session = Depends(get_db)):
    if data.codigo:
        dup = db.query(models.Agencia).filter(models.Agencia.codigo == data.codigo.upper()).first()
        if dup:
            raise HTTPException(status_code=400, detail="Ya existe una agencia con este código")
    a = models.Agencia(
        nombre=data.nombre,
        codigo=data.codigo.upper() if data.codigo else None,
        direccion=data.direccion,
        telefono=data.telefono,
        tipo=data.tipo,
        estado=data.estado,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return format_agencia(a)

@app.put("/api/v1/agencias/{id_agencia}")
def actualizar_agencia(id_agencia: int, data: AgenciaCreate, db: Session = Depends(get_db)):
    a = db.query(models.Agencia).filter(models.Agencia.id_agencia == id_agencia).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agencia no encontrada")
    a.nombre = data.nombre
    if data.codigo:
        a.codigo = data.codigo.upper()
    a.direccion = data.direccion
    a.telefono = data.telefono
    a.tipo = data.tipo
    a.estado = data.estado
    db.commit()
    db.refresh(a)
    return format_agencia(a)

@app.delete("/api/v1/agencias/{id_agencia}")
def eliminar_agencia(id_agencia: int, db: Session = Depends(get_db)):
    a = db.query(models.Agencia).filter(models.Agencia.id_agencia == id_agencia).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agencia no encontrada")
    db.delete(a)
    db.commit()
    return {"message": "Agencia eliminada"}

# --- Areas Restringidas ---

@app.get("/api/v1/areas")
def listar_areas(db: Session = Depends(get_db)):
    areas = db.query(models.AreaRestringida).all()
    result = []
    for a in areas:
        # Calcular allowedRoles: roles que tienen el permiso requerido del área
        if a.id_permiso_requerido:
            roles_con_permiso = db.query(models.Rol).join(
                models.roles_permisos,
                models.Rol.id_rol == models.roles_permisos.c.id_rol
            ).filter(
                models.roles_permisos.c.id_permiso == a.id_permiso_requerido
            ).all()
            allowed = [r.nombre for r in roles_con_permiso]
            if "admin" not in allowed:
                allowed.append("admin")
        else:
            allowed = ["all"]

        agencia_codigo = None
        if a.agencia:
            agencia_codigo = a.agencia.codigo or a.agencia.nombre
        result.append({
            "id": f"AR-{a.id_area}",
            "id_area": a.id_area,
            "name": a.nombre,
            "riskLevel": a.nivel_riesgo,
            "status": "Protegido" if a.estado else "Inactivo",
            "schedule": a.horario or "08:00 - 18:00",
            "allowedRoles": allowed,
            "agency": agencia_codigo,
        })
    return result

@app.put("/api/v1/areas/{id_area}")
def actualizar_area(id_area: int, data: AreaUpdate, db: Session = Depends(get_db)):
    a = db.query(models.AreaRestringida).filter(models.AreaRestringida.id_area == id_area).first()
    if not a:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    if data.nivel_riesgo:
        a.nivel_riesgo = data.nivel_riesgo
    if data.horario:
        a.horario = data.horario
    db.commit()
    db.refresh(a)
    return {"id": f"AR-{a.id_area}", "name": a.nombre, "riskLevel": a.nivel_riesgo, "schedule": a.horario}

# --- Roles ---

@app.get("/api/v1/roles")
def listar_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Rol).all()
    return [{
        "id": r.id_rol,
        "name": r.nombre,
        "description": r.descripcion,
        "active": r.activo,
        "permissions": [p.codigo_permiso for p in r.permisos]
    } for r in roles]

@app.put("/api/v1/roles/{id_rol}")
def actualizar_rol(id_rol: int, data: dict, db: Session = Depends(get_db)):
    rol = db.query(models.Rol).filter(models.Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    permisos_codigos = data.get("permissions", [])
    # Buscar permisos existentes
    permisos = db.query(models.Permiso).filter(models.Permiso.codigo_permiso.in_(permisos_codigos)).all()
    # Crear permisos faltantes
    existing_codes = {p.codigo_permiso for p in permisos}
    for code in permisos_codigos:
        if code not in existing_codes:
            nuevo = models.Permiso(codigo_permiso=code, descripcion=code)
            db.add(nuevo)
            db.flush()
            permisos.append(nuevo)
    rol.permisos = permisos
    db.commit()
    db.refresh(rol)
    return {
        "id": rol.id_rol,
        "name": rol.nombre,
        "permissions": [p.codigo_permiso for p in rol.permisos]
    }

# --- Dashboard de Auditoría ---

@app.get("/api/v1/audit/dashboard")
def get_audit_dashboard(db: Session = Depends(get_db)):
    from sqlalchemy import func, extract

    # Totales de bitácora
    total_logs   = db.query(func.count(models.BitacoraAcceso.id_bitacora)).scalar() or 0
    concedidos   = db.query(func.count(models.BitacoraAcceso.id_bitacora)).filter(models.BitacoraAcceso.resultado == "CONCEDIDO").scalar() or 0
    denegados    = db.query(func.count(models.BitacoraAcceso.id_bitacora)).filter(models.BitacoraAcceso.resultado == "DENEGADO").scalar() or 0

    compliance   = round(concedidos / total_logs * 100, 1) if total_logs > 0 else 100.0
    risk_level   = round(denegados  / total_logs * 100, 1) if total_logs > 0 else 0.0

    # Alertas por estado
    total_alerts   = db.query(func.count(models.AlertaSeguridad.id_alerta)).scalar() or 0
    open_alerts    = db.query(func.count(models.AlertaSeguridad.id_alerta)).filter(models.AlertaSeguridad.estado == "ABIERTA").scalar() or 0
    investigating  = db.query(func.count(models.AlertaSeguridad.id_alerta)).filter(models.AlertaSeguridad.estado == "EN_INVESTIGACION").scalar() or 0
    resolved_alerts = db.query(func.count(models.AlertaSeguridad.id_alerta)).filter(models.AlertaSeguridad.estado == "RESUELTA").scalar() or 0

    # Áreas y empleados activos
    active_areas     = db.query(func.count(models.AreaRestringida.id_area)).filter(models.AreaRestringida.estado == True).scalar() or 0
    total_areas      = db.query(func.count(models.AreaRestringida.id_area)).scalar() or 0
    active_employees = db.query(func.count(models.Empleado.id_empleado)).filter(models.Empleado.estado_laboral == "ACTIVO").scalar() or 0
    total_roles      = db.query(func.count(models.Rol.id_rol)).filter(models.Rol.activo == True).scalar() or 0

    # Dispositivos activos
    active_devices = db.query(func.count(models.DispositivoEscaneo.id_dispositivo)).filter(models.DispositivoEscaneo.estado == True).scalar() or 0

    # Datos mensuales — últimos 6 meses
    now = datetime.datetime.utcnow()
    month_names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    monthly_data = []
    for i in range(5, -1, -1):
        raw_month  = now.month - i
        year  = now.year + (raw_month - 1) // 12
        month = ((raw_month - 1) % 12) + 1
        m_total = db.query(func.count(models.BitacoraAcceso.id_bitacora)).filter(
            extract('year',  models.BitacoraAcceso.fecha_hora) == year,
            extract('month', models.BitacoraAcceso.fecha_hora) == month,
        ).scalar() or 0
        m_conc = db.query(func.count(models.BitacoraAcceso.id_bitacora)).filter(
            extract('year',  models.BitacoraAcceso.fecha_hora) == year,
            extract('month', models.BitacoraAcceso.fecha_hora) == month,
            models.BitacoraAcceso.resultado == "CONCEDIDO",
        ).scalar() or 0
        monthly_data.append({
            "month": month_names[month - 1],
            "year": year,
            "value": round(m_conc / m_total * 100, 1) if m_total > 0 else None,
            "total": m_total,
            "concedidos": m_conc,
            "denegados": m_total - m_conc,
        })

    # Últimas 10 alertas resueltas (para historial)
    resolved_history = db.query(models.AlertaSeguridad).filter(
        models.AlertaSeguridad.estado == "RESUELTA"
    ).order_by(models.AlertaSeguridad.fecha_generacion.desc()).limit(10).all()
    history = [{
        "id":     f"ALT-{a.id_alerta}",
        "date":   utc_iso(a.fecha_generacion),
        "type":   a.tipo_alerta,
        "area":   a.bitacora.area.nombre if (a.bitacora and a.bitacora.area) else "Sistema",
        "status": "Resuelta",
    } for a in resolved_history]

    return {
        "kpis": {
            "compliance_score":  compliance,
            "risk_level":        risk_level,
            "total_logs":        total_logs,
            "concedidos":        concedidos,
            "denegados":         denegados,
            "active_areas":      active_areas,
            "total_areas":       total_areas,
            "active_employees":  active_employees,
            "total_roles":       total_roles,
            "active_devices":    active_devices,
        },
        "alerts": {
            "total":       total_alerts,
            "open":        open_alerts,
            "investigating": investigating,
            "resolved":    resolved_alerts,
        },
        "monthly_chart": monthly_data,
        "resolved_history": history,
    }

# --- Bitácora / Logs ---

@app.get("/api/v1/audit-logs")
def listar_logs(db: Session = Depends(get_db)):
    logs = db.query(models.BitacoraAcceso).order_by(models.BitacoraAcceso.fecha_hora.desc()).limit(200).all()
    result = []
    for l in logs:
        emp_name = f"{l.empleado.nombres} {l.empleado.apellidos}" if l.empleado else "Desconocido"
        emp_role = l.empleado.roles[0].nombre if (l.empleado and l.empleado.roles) else "empleado"
        emp_agency = "MAT"
        if l.empleado and l.empleado.agencia_base:
            emp_agency = l.empleado.agencia_base.codigo or "MAT"
        risk = "Alto" if l.resultado == "DENEGADO" else "Bajo"
        result.append({
            "id": f"LOG-{l.id_bitacora}",
            "timestamp": utc_iso(l.fecha_hora),
            "employeeId": f"KW-{l.empleado.id_empleado:03d}" if l.empleado else "N/A",
            "name": emp_name,
            "role": emp_role,
            "agency": emp_agency,
            "area": l.area.nombre if l.area else f"Área {l.id_area}",
            "device": l.dispositivo.identificador_equipo if l.dispositivo else f"Disp. {l.id_dispositivo}",
            "status": "Autorizado" if l.resultado == "CONCEDIDO" else "Denegado",
            "details": l.motivo or "",
            "risk": risk,
        })
    return result

# --- Alertas de Seguridad ---

@app.get("/api/v1/security/alerts")
def listar_alertas(db: Session = Depends(get_db)):
    alertas = db.query(models.AlertaSeguridad).order_by(models.AlertaSeguridad.fecha_generacion.desc()).all()
    result = []
    for a in alertas:
        motivo = a.bitacora.motivo if a.bitacora else "Sin detalles"
        area_nombre = a.bitacora.area.nombre if (a.bitacora and a.bitacora.area) else "Sistema"
        # Resolver la agencia real desde la cadena alerta → bitácora → área → agencia
        ag_obj = None
        if a.bitacora and a.bitacora.area and a.bitacora.area.agencia:
            ag_obj = a.bitacora.area.agencia
        agencia_codigo = (ag_obj.codigo or ag_obj.nombre) if ag_obj else None
        severity = "Crítica" if "Denegado" in a.tipo_alerta or "Intrusión" in a.tipo_alerta else "Alta"
        result.append({
            "id": f"ALT-{a.id_alerta}",
            "id_alerta": a.id_alerta,
            "type": a.tipo_alerta,
            "severity": severity,
            "status": a.estado,
            "area": area_nombre,
            "agency": agencia_codigo,
            "date": utc_iso(a.fecha_generacion),
            "details": motivo,
            "isResolved": a.estado == "RESUELTA",
            "resolvedBy": "",
            "timestamp": utc_iso(a.fecha_generacion),
        })
    return result

@app.put("/api/v1/security/alerts/{id_alerta}")
def actualizar_alerta(id_alerta: int, data: dict, db: Session = Depends(get_db)):
    a = db.query(models.AlertaSeguridad).filter(models.AlertaSeguridad.id_alerta == id_alerta).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    nuevo_estado = data.get("estado", a.estado)
    a.estado = nuevo_estado
    db.commit()
    return {"id": f"ALT-{a.id_alerta}", "estado": a.estado}

# --- Dispositivos / IoT Scan ---

@app.get("/api/v1/dispositivos")
def listar_dispositivos(db: Session = Depends(get_db)):
    devs = db.query(models.DispositivoEscaneo).all()
    result = []
    for d in devs:
        area_nombre = d.area.nombre if d.area else "Sin área"
        # Derivar agencia del área
        agency = "MAT"
        if d.area and d.area.id_agencia:
            ag = db.query(models.Agencia).filter(models.Agencia.id_agencia == d.area.id_agencia).first()
            if ag:
                agency = ag.codigo or "MAT"
        result.append({
            "id": f"DEV-{d.id_dispositivo:02d}",
            "id_dispositivo": d.id_dispositivo,
            "name": d.identificador_equipo,
            "type": "Lector QR",
            "area": area_nombre,
            "agency": agency,
            "ip": d.ip_address or f"192.168.10.{20 + d.id_dispositivo}",
            "status": "Online" if d.estado else "Offline",
            "lastPulse": utc_iso(d.ultima_sincronizacion),
            "mac": d.mac_address or "",
        })
    return result

@app.post("/api/v1/scan/simulate")
def simular_escaneo(data: dict, db: Session = Depends(get_db)):
    """Endpoint para el simulador QR del frontend — graba en BitacoraAcceso y AlertaSeguridad."""
    id_empleado = data.get("id_empleado")
    id_dispositivo = data.get("id_dispositivo")
    resultado = data.get("resultado", "DENEGADO")
    motivo = data.get("motivo", "")

    disp = db.query(models.DispositivoEscaneo).filter(
        models.DispositivoEscaneo.id_dispositivo == id_dispositivo
    ).first()
    if not disp:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    bitacora = models.BitacoraAcceso(
        id_empleado=id_empleado,
        id_area=disp.id_area,
        id_dispositivo=id_dispositivo,
        resultado=resultado,
        motivo=motivo,
    )
    db.add(bitacora)
    db.commit()
    db.refresh(bitacora)

    if resultado == "DENEGADO":
        tipo = "Intento de Acceso Denegado (Simulador)"
        if not id_empleado:
            tipo = "QR Desconocido/Falsificado (Simulador)"
        alerta = models.AlertaSeguridad(
            id_bitacora_asociada=bitacora.id_bitacora,
            tipo_alerta=tipo,
        )
        db.add(alerta)
        db.commit()

    return {"status": resultado, "id_bitacora": bitacora.id_bitacora}


@app.post("/api/v1/scan")
def registrar_escaneo(data: dict, db: Session = Depends(get_db)):
    id_dispositivo = data.get("id_dispositivo", 1)
    disp = db.query(models.DispositivoEscaneo).filter(models.DispositivoEscaneo.id_dispositivo == id_dispositivo).first()
    if not disp or not disp.id_area:
        raise HTTPException(status_code=400, detail="Dispositivo inválido o sin área asignada")
    area = disp.area
    dni = data.get("dni")
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == dni).first()
    resultado = "DENEGADO"
    motivo = "Empleado no encontrado"
    if emp and emp.estado_laboral == "ACTIVO":
        tiene_permiso = False
        for r in emp.roles:
            for p in r.permisos:
                if p.id_permiso == area.id_permiso_requerido or p.codigo_permiso == "acceso_total":
                    tiene_permiso = True
                    break
        if tiene_permiso:
            resultado = "CONCEDIDO"
            motivo = "Acceso autorizado"
        else:
            motivo = f"Falta permiso requerido para el área {area.nombre}"
    elif emp and emp.estado_laboral != "ACTIVO":
        motivo = "Empleado inactivo"
    bitacora = models.BitacoraAcceso(
        id_empleado=emp.id_empleado if emp else None,
        id_area=area.id_area,
        id_dispositivo=disp.id_dispositivo,
        resultado=resultado,
        motivo=motivo
    )
    db.add(bitacora)
    db.commit()
    db.refresh(bitacora)
    if resultado == "DENEGADO":
        alerta = models.AlertaSeguridad(
            id_bitacora_asociada=bitacora.id_bitacora,
            tipo_alerta="Intento de Acceso Denegado (Posible Intrusión)"
        )
        db.add(alerta)
        db.commit()
    return {"status": resultado, "motivo": motivo}
