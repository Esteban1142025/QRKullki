from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Time, BigInteger, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

# Tablas intermedias
roles_permisos = Table(
    'roles_permisos', Base.metadata,
    Column('id_rol', BigInteger, ForeignKey('roles.id_rol', ondelete="CASCADE"), primary_key=True),
    Column('id_permiso', BigInteger, ForeignKey('permisos.id_permiso', ondelete="CASCADE"), primary_key=True)
)

empleados_roles = Table(
    'empleados_roles', Base.metadata,
    Column('id_empleado', BigInteger, ForeignKey('empleados.id_empleado', ondelete="CASCADE"), primary_key=True),
    Column('id_rol', BigInteger, ForeignKey('roles.id_rol', ondelete="CASCADE"), primary_key=True)
)

class Agencia(Base):
    __tablename__ = "agencias"

    id_agencia = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(10), nullable=True)
    direccion = Column(Text, nullable=True)
    telefono = Column(String(20), nullable=True)
    tipo = Column(String(30), default='Sucursal')
    estado = Column(Boolean, default=True)

class Permiso(Base):
    __tablename__ = "permisos"

    id_permiso = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    codigo_permiso = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text, nullable=True)

class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)

    permisos = relationship("Permiso", secondary=roles_permisos, backref="roles")

class Empleado(Base):
    __tablename__ = "empleados"

    id_empleado = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_agencia_base = Column(BigInteger, ForeignKey("agencias.id_agencia", ondelete="SET NULL"), nullable=True)
    identificacion = Column(String(20), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    totp_secret = Column(String(255), nullable=True)
    estado_laboral = Column(String(20), default='ACTIVO')
    departamento = Column(String(100), nullable=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

    agencia_base = relationship("Agencia", backref="empleados")
    roles = relationship("Rol", secondary=empleados_roles, backref="empleados")

class AreaRestringida(Base):
    __tablename__ = "areas_restringidas"

    id_area = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_agencia = Column(BigInteger, ForeignKey("agencias.id_agencia", ondelete="CASCADE"), nullable=True)
    nombre = Column(String(100), nullable=False)
    nivel_riesgo = Column(String(50), nullable=False)
    id_permiso_requerido = Column(BigInteger, ForeignKey("permisos.id_permiso", ondelete="SET NULL"), nullable=True)
    estado = Column(Boolean, default=True)
    horario = Column(String(50), default='08:00 - 18:00')

    permiso_requerido = relationship("Permiso")

class EmpleadoArea(Base):
    __tablename__ = "empleados_areas"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_empleado = Column(BigInteger, ForeignKey("empleados.id_empleado", ondelete="CASCADE"), nullable=False)
    id_area = Column(BigInteger, ForeignKey("areas_restringidas.id_area", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(Integer, nullable=True)
    horario_inicio = Column(Time, nullable=True)
    horario_fin = Column(Time, nullable=True)

    empleado = relationship("Empleado", backref="excepciones_areas")
    area = relationship("AreaRestringida")

class DispositivoEscaneo(Base):
    __tablename__ = "dispositivos_escaneo"

    id_dispositivo = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_area = Column(BigInteger, ForeignKey("areas_restringidas.id_area", ondelete="SET NULL"), nullable=True)
    identificador_equipo = Column(String(100), unique=True, nullable=False)
    mac_address = Column(String(50), nullable=True)
    estado = Column(Boolean, default=True)
    ultima_sincronizacion = Column(DateTime, nullable=True)

    area = relationship("AreaRestringida")

class BitacoraAcceso(Base):
    __tablename__ = "bitacora_accesos"

    id_bitacora = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_empleado = Column(BigInteger, ForeignKey("empleados.id_empleado", ondelete="CASCADE"), nullable=True)
    id_area = Column(BigInteger, ForeignKey("areas_restringidas.id_area", ondelete="CASCADE"), nullable=True)
    id_dispositivo = Column(BigInteger, ForeignKey("dispositivos_escaneo.id_dispositivo", ondelete="SET NULL"), nullable=True)
    fecha_hora = Column(DateTime, default=datetime.datetime.utcnow)
    tipo_movimiento = Column(String(10), default='IN')
    resultado = Column(String(20), nullable=False)
    motivo = Column(Text, nullable=True)

    empleado = relationship("Empleado")
    area = relationship("AreaRestringida")
    dispositivo = relationship("DispositivoEscaneo")

class AlertaSeguridad(Base):
    __tablename__ = "alertas_seguridad"

    id_alerta = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    id_bitacora_asociada = Column(BigInteger, ForeignKey("bitacora_accesos.id_bitacora", ondelete="CASCADE"), nullable=True)
    tipo_alerta = Column(String(100), nullable=False)
    estado = Column(String(50), default='ABIERTA')
    fecha_generacion = Column(DateTime, default=datetime.datetime.utcnow)

    bitacora = relationship("BitacoraAcceso")
