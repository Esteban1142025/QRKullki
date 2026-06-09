from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional
import database
import models
import datetime
import bcrypt
import jwt
import pyotp

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
    totpCode: Optional[str] = None

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
    if emp.agencia_base:
        agencia_codigo = emp.agencia_base.codigo or "MAT"

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
            "status": emp.estado_laboral
        }
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

        result.append({
            "id": f"AR-{a.id_area}",
            "id_area": a.id_area,
            "name": a.nombre,
            "riskLevel": a.nivel_riesgo,
            "status": "Protegido" if a.estado else "Inactivo",
            "schedule": a.horario or "08:00 - 18:00",
            "allowedRoles": allowed,
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
            "timestamp": l.fecha_hora.isoformat(),
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
        severity = "Crítica" if "Denegado" in a.tipo_alerta or "Intrusión" in a.tipo_alerta else "Alta"
        result.append({
            "id": f"ALT-{a.id_alerta}",
            "id_alerta": a.id_alerta,
            "type": a.tipo_alerta,
            "severity": severity,
            "status": a.estado,
            "area": area_nombre,
            "agency": "Sistema",
            "date": a.fecha_generacion.isoformat(),
            "details": motivo,
            "isResolved": a.estado == "RESUELTA",
            "resolvedBy": "",
            "timestamp": a.fecha_generacion.isoformat(),
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
            "lastPulse": d.ultima_sincronizacion.isoformat() if d.ultima_sincronizacion else None,
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
    totp_escaneado = data.get("totpCode")
    id_dispositivo = data.get("id_dispositivo", 1)
    disp = db.query(models.DispositivoEscaneo).filter(models.DispositivoEscaneo.id_dispositivo == id_dispositivo).first()
    if not disp or not disp.id_area:
        raise HTTPException(status_code=400, detail="Dispositivo inválido o sin área asignada")
    area = disp.area
    dni = data.get("dni")
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == dni).first()
    resultado = "DENEGADO"
    motivo = "Empleado no encontrado o sin TOTP"
    if emp and emp.totp_secret:
        totp = pyotp.TOTP(emp.totp_secret)
        if totp.verify(totp_escaneado):
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
        else:
            motivo = "Código TOTP inválido o clonado"
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
