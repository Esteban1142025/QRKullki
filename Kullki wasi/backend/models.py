from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Time, BigInteger
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Agencia(Base):
    __tablename__ = "agencias"

    id_agencia = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(Text, nullable=True)
    estado = Column(Boolean, default=True)

class AreaRestringida(Base):
    __tablename__ = "areas_restringidas"

    id_area = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_agencia = Column(Integer, ForeignKey("agencias.id_agencia"), nullable=True)
    nombre = Column(String(100), nullable=False)
    nivel_riesgo = Column(String(50), nullable=False)
    estado = Column(Boolean, default=True)

class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)

class Empleado(Base):
    __tablename__ = "empleados"

    id_empleado = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=True)
    id_agencia_base = Column(Integer, ForeignKey("agencias.id_agencia"), nullable=True)
    identificacion = Column(String(20), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    token_qr = Column(String(250), unique=True, nullable=True)
    estado_laboral = Column(String(20), default='ACTIVO')

    rol = relationship("Rol", backref="empleados")
    agencia_base = relationship("Agencia", backref="empleados")

class PermisoAcceso(Base):
    __tablename__ = "permisos_acceso"

    id_permiso = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=True)
    id_area = Column(Integer, ForeignKey("areas_restringidas.id_area"), nullable=True)

class HorarioEmpleado(Base):
    __tablename__ = "horarios_empleados"

    id_horario = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"), nullable=True)
    dia_semana = Column(Integer, nullable=False)
    horario_inicio = Column(Time, nullable=False)
    horario_fin = Column(Time, nullable=False)

class DispositivoEscaneo(Base):
    __tablename__ = "dispositivos_escaneo"

    id_dispositivo = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_area = Column(Integer, ForeignKey("areas_restringidas.id_area"), nullable=True)
    identificador_equipo = Column(String(100), unique=True, nullable=False)
    estado = Column(Boolean, default=True)

class BitacoraAcceso(Base):
    __tablename__ = "bitacora_accesos"

    id_bitacora = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"), nullable=True)
    id_area = Column(Integer, ForeignKey("areas_restringidas.id_area"), nullable=True)
    id_dispositivo = Column(Integer, ForeignKey("dispositivos_escaneo.id_dispositivo"), nullable=True)
    fecha_hora = Column(DateTime, default=datetime.datetime.utcnow)
    resultado = Column(String(20), nullable=False)
    motivo = Column(Text, nullable=True)
