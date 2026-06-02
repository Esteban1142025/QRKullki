from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
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

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

app = FastAPI(
    title="Sistema de Accesos y Trazabilidad Kullki Wasi (Arquitectura Empresarial)",
    description="Servicios REST API y conexión MySQL para control SEPS con JWT y TOTP",
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
        print("Tablas de Base de Datos MySQL inicializadas con éxito (3NF).")
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
    dniOrEmail: str
    password: str
    totpCode: Optional[str] = None  # Código QR Dinámico (6 dígitos)

class EmpleadoBase(BaseModel):
    identificacion: str
    nombres: str
    apellidos: str
    email: Optional[str] = None
    id_agencia_base: Optional[int] = None
    estado_laboral: str = "ACTIVO"
    role_ids: List[int] = []

class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    model_config = ConfigDict(from_attributes=True)

class LogResponse(BaseModel):
    id_bitacora: int
    fecha_hora: datetime.datetime
    resultado: str
    motivo: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- Rutas Auth ---
@app.post("/api/v1/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(
        (models.Empleado.identificacion == req.dniOrEmail) | 
        (models.Empleado.email == req.dniOrEmail)
    ).first()
    
    if not emp:
        # Fallback para poder entrar si la DB está vacía o si el usuario usa admin sin DB
        if req.dniOrEmail == "admin":
            return {
                "token": create_access_token({"sub": "admin", "roles": ["admin"]}),
                "user": {
                    "id": "KW-000",
                    "name": "Administrador Fallback",
                    "role": "admin",
                    "permissions": ["acceso_total"]
                }
            }
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    if emp.estado_laboral != "ACTIVO":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    
    if not emp.password_hash or not verify_password(req.password, emp.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    # Se elimina la verificación TOTP a petición del usuario
    
    # Extraer roles y permisos
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

    return {
        "token": access_token,
        "user": {
            "id": f"KW-{emp.id_empleado}",
            "dni": emp.identificacion,
            "name": f"{emp.nombres} {emp.apellidos}",
            "email": emp.email,
            "role": rol_principal,
            "permissions": list(set(permisos)),
            "roleName": rol_principal.capitalize(),
            "status": emp.estado_laboral
        }
    }

# --- Rutas Empleados ---
@app.get("/api/v1/empleados")
def listar_empleados(db: Session = Depends(get_db)):
    empleados = db.query(models.Empleado).all()
    return [{
        "id": f"KW-{e.id_empleado}",
        "dni": e.identificacion,
        "name": f"{e.nombres} {e.apellidos}",
        "role": e.roles[0].nombre if e.roles else "Sin Rol",
        "email": e.email,
        "status": e.estado_laboral,
    } for e in empleados]

# --- Rutas Areas y Dispositivos (Simulación IoT/Escaneo) ---
@app.post("/api/v1/scan")
def registrar_escaneo(data: dict, db: Session = Depends(get_db)):
    # Simula un escaneo desde un dispositivo IoT
    totp_escaneado = data.get("totpCode")
    id_dispositivo = data.get("id_dispositivo", 1)
    
    disp = db.query(models.DispositivoEscaneo).filter(models.DispositivoEscaneo.id_dispositivo == id_dispositivo).first()
    if not disp or not disp.id_area:
        raise HTTPException(status_code=400, detail="Dispositivo inválido o sin área asignada")
        
    area = disp.area
    
    # Buscar empleado por TOTP (esto es costoso en la vida real, lo ideal es enviar DNI + TOTP, 
    # pero para la contingencia asumo que buscan iterando los secrets o mandando un identificador)
    # Por simplicidad, simularemos DNI + TOTP
    dni = data.get("dni")
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == dni).first()
    
    resultado = "DENEGADO"
    motivo = "Empleado no encontrado o sin TOTP"
    
    if emp and emp.totp_secret:
        totp = pyotp.TOTP(emp.totp_secret)
        if totp.verify(totp_escaneado):
            # Validar permisos
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
            
    # Registrar en bitácora
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
    
    # Generar alerta ITIL si fue denegado
    if resultado == "DENEGADO":
        alerta = models.AlertaSeguridad(
            id_bitacora_asociada=bitacora.id_bitacora,
            tipo_alerta="Intento de Acceso Denegado (Posible Intrusión)"
        )
        db.add(alerta)
        db.commit()

    return {"status": resultado, "motivo": motivo}

# --- Alertas ITIL ---
@app.get("/api/v1/security/alerts")
def listar_alertas(db: Session = Depends(get_db)):
    alertas = db.query(models.AlertaSeguridad).order_by(models.AlertaSeguridad.fecha_generacion.desc()).all()
    return [{
        "id": a.id_alerta,
        "type": a.tipo_alerta,
        "status": a.estado,
        "date": a.fecha_generacion.isoformat(),
        "details": a.bitacora.motivo if a.bitacora else "Sin detalles"
    } for a in alertas]

@app.get("/api/v1/audit-logs")
def listar_logs(db: Session = Depends(get_db)):
    logs = db.query(models.BitacoraAcceso).order_by(models.BitacoraAcceso.fecha_hora.desc()).limit(100).all()
    return [{
        "id": l.id_bitacora,
        "timestamp": l.fecha_hora.isoformat(),
        "name": f"{l.empleado.nombres} {l.empleado.apellidos}" if l.empleado else f"Desconocido",
        "area": l.area.nombre if l.area else f"Área {l.id_area}",
        "device": l.dispositivo.identificador_equipo if l.dispositivo else f"Disp. {l.id_dispositivo}",
        "status": l.resultado,
        "details": l.motivo
    } for l in logs]
