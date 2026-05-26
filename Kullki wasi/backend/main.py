from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import database
import models
import datetime

app = FastAPI(
    title="Sistema de Accesos y Trazabilidad Kullki Wasi",
    description="Servicios REST API y conexión MySQL para control SEPS",
    version="1.1.0"
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
        print("Tablas de Base de Datos MySQL inicializadas con éxito.")
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

class EmpleadoBase(BaseModel):
    identificacion: str
    nombres: str
    apellidos: str
    id_rol: Optional[int] = None
    id_agencia_base: Optional[int] = None
    estado_laboral: str = "ACTIVO"

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    token_qr: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class AgenciaResponse(BaseModel):
    id_agencia: int
    nombre: str
    direccion: Optional[str] = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)

class RolResponse(BaseModel):
    id_rol: int
    nombre: str
    descripcion: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AreaResponse(BaseModel):
    id_area: int
    id_agencia: Optional[int] = None
    nombre: str
    nivel_riesgo: str
    estado: bool
    model_config = ConfigDict(from_attributes=True)

class DispositivoResponse(BaseModel):
    id_dispositivo: int
    id_area: Optional[int] = None
    identificador_equipo: str
    estado: bool
    model_config = ConfigDict(from_attributes=True)

class LogResponse(BaseModel):
    id_bitacora: int
    id_empleado: Optional[int] = None
    id_area: Optional[int] = None
    id_dispositivo: Optional[int] = None
    fecha_hora: datetime.datetime
    resultado: str
    motivo: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- Rutas Auth ---
@app.post("/api/v1/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(models.Empleado.identificacion == req.dniOrEmail).first()
    if not emp:
        # Fallback para poder entrar si la DB está vacía o si el usuario usa admin
        if req.dniOrEmail == "admin":
            return {
                "token": "fake-jwt-token-db",
                "user": {
                    "id": "KW-000",
                    "name": "Administrador DB",
                    "role": "admin",
                    "agency": "MAT",
                    "permissions": ["all"],
                    "roleName": "Administrador General",
                    "badgeColor": "bg-red-500/20 text-red-400 border-red-500/30"
                }
            }
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    if emp.estado_laboral != "ACTIVO":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    
    rol_nombre = emp.rol.nombre if emp.rol else "Usuario DB"
    agencia_nombre = emp.agencia_base.nombre if emp.agencia_base else "MAT"
    role_id_str = str(emp.id_rol) if emp.id_rol else "empleado"
    agencia_id_str = str(emp.id_agencia_base) if emp.id_agencia_base else "MAT"

    # Return user info matching what frontend expects, using real db values
    return {
        "token": "fake-jwt-token-db",
        "user": {
            "id": f"KW-{emp.id_empleado}",
            "dni": emp.identificacion,
            "name": f"{emp.nombres} {emp.apellidos}",
            "role": role_id_str,
            "agency": agencia_id_str,
            "permissions": ["all"],
            "roleName": rol_nombre,
            "badgeColor": "bg-blue-500/20 text-blue-400 border-blue-500/30",
            "email": f"{emp.nombres.lower().replace(' ', '')}@kullkiwasi.com.ec",
            "department": "Operaciones",
            "status": emp.estado_laboral
        }
    }

# --- Rutas Empleados ---
@app.get("/api/v1/empleados")
def listar_empleados(db: Session = Depends(get_db)):
    empleados = db.query(models.Empleado).all()
    # Mapear para el frontend con valores reales
    return [{
        "id": f"KW-{e.id_empleado}",
        "dni": e.identificacion,
        "name": f"{e.nombres} {e.apellidos}",
        "role": e.rol.nombre if e.rol else (str(e.id_rol) if e.id_rol else "empleado"),
        "department": "Caja y Servicios",
        "agency": e.agencia_base.nombre if e.agencia_base else (str(e.id_agencia_base) if e.id_agencia_base else "MAT"),
        "email": f"{e.identificacion}@kullkiwasi.com.ec",
        "phone": "0999999999",
        "status": e.estado_laboral,
        "qrCode": e.token_qr,
        "photo": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    } for e in empleados]

@app.post("/api/v1/empleados")
def crear_empleado(emp: dict, db: Session = Depends(get_db)):
    # Adaptar lo que manda el frontend al formato DB
    # emp from frontend: { dni, name, role, department, agency, email, phone, status, qrCode }
    nombres_split = emp.get("name", "").split(" ")
    nombres = nombres_split[0]
    apellidos = " ".join(nombres_split[1:]) if len(nombres_split) > 1 else ""
    
    rol_val = emp.get("role")
    agencia_val = emp.get("agency")
    
    # Tratamos de castear a int si es un ID, sino dejamos NULL (o buscamos por nombre)
    id_rol_val = int(rol_val) if rol_val and str(rol_val).isdigit() else 1
    id_agencia_val = int(agencia_val) if agencia_val and str(agencia_val).isdigit() else 1
    
    nuevo_emp = models.Empleado(
        identificacion=emp.get("dni", "000"),
        nombres=nombres,
        apellidos=apellidos,
        id_rol=id_rol_val,
        id_agencia_base=id_agencia_val,
        estado_laboral=emp.get("status", "ACTIVO"),
        token_qr=emp.get("qrCode", "")
    )
    db.add(nuevo_emp)
    db.commit()
    db.refresh(nuevo_emp)
    
    return {
        "id": f"KW-{nuevo_emp.id_empleado}",
        "dni": nuevo_emp.identificacion,
        "name": f"{nuevo_emp.nombres} {nuevo_emp.apellidos}",
        "status": nuevo_emp.estado_laboral
    }

@app.delete("/api/v1/empleados/{id}")
def eliminar_empleado(id: str, db: Session = Depends(get_db)):
    # el ID viene como KW-123
    real_id = int(id.replace("KW-", "")) if "KW-" in id else int(id)
    emp = db.query(models.Empleado).filter(models.Empleado.id_empleado == real_id).first()
    if emp:
        db.delete(emp)
        db.commit()
    return {"status": "ok"}

# --- Rutas Agencias ---
@app.get("/api/v1/agencias")
def listar_agencias(db: Session = Depends(get_db)):
    # Mapear para frontend (requiere id, name)
    agencias = db.query(models.Agencia).all()
    return [{"id": a.id_agencia, "name": a.nombre, "address": a.direccion, "status": "Activo" if a.estado else "Inactivo"} for a in agencias]

# --- Rutas Roles ---
@app.get("/api/v1/rbac/roles")
def listar_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Rol).all()
    return [{"id": r.id_rol, "name": r.nombre, "description": r.descripcion} for r in roles]

# --- Rutas Areas ---
@app.get("/api/v1/areas")
def listar_areas(db: Session = Depends(get_db)):
    areas = db.query(models.AreaRestringida).all()
    return [{"id": a.id_area, "name": a.nombre, "riskLevel": a.nivel_riesgo, "status": "Protegido" if a.estado else "Libre"} for a in areas]

# --- Rutas Dispositivos ---
@app.get("/api/v1/devices")
def listar_dispositivos(db: Session = Depends(get_db)):
    dispositivos = db.query(models.DispositivoEscaneo).all()
    return [{"id": d.id_dispositivo, "name": d.identificador_equipo, "status": "Online" if d.estado else "Offline"} for d in dispositivos]

# --- Rutas Bitácora ---
@app.get("/api/v1/audit-logs")
def listar_logs(db: Session = Depends(get_db)):
    logs = db.query(models.BitacoraAcceso).order_by(models.BitacoraAcceso.fecha_hora.desc()).limit(100).all()
    # Mapear para frontend
    return [{
        "id": l.id_bitacora,
        "timestamp": l.fecha_hora.isoformat(),
        "name": f"Empleado {l.id_empleado}",
        "area": f"Area {l.id_area}",
        "device": f"Dispositivo {l.id_dispositivo}",
        "status": l.resultado,
        "details": l.motivo
    } for l in logs]

# --- Security Alerts (Mock for now to satisfy frontend) ---
@app.get("/api/v1/security/alerts")
def listar_alertas(db: Session = Depends(get_db)):
    return []
