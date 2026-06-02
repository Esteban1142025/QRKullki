-- Script SQL para PostgreSQL
-- Base de datos: kullki_wasi_db

-- 1. Agencias
DROP TABLE IF EXISTS agencias CASCADE;
CREATE TABLE agencias (
  id_agencia BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion TEXT,
  estado BOOLEAN DEFAULT true
);

-- 2. Permisos (RBAC Dinámico)
DROP TABLE IF EXISTS permisos CASCADE;
CREATE TABLE permisos (
  id_permiso BIGSERIAL PRIMARY KEY,
  codigo_permiso VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

-- 3. Roles
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id_rol BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true
);

-- 4. Roles_Permisos (Intermedia)
DROP TABLE IF EXISTS roles_permisos CASCADE;
CREATE TABLE roles_permisos (
  id_rol BIGINT NOT NULL,
  id_permiso BIGINT NOT NULL,
  PRIMARY KEY (id_rol, id_permiso),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE,
  FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
);

-- 5. Empleados
DROP TABLE IF EXISTS empleados CASCADE;
CREATE TABLE empleados (
  id_empleado BIGSERIAL PRIMARY KEY,
  id_agencia_base BIGINT,
  identificacion VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  totp_secret VARCHAR(255),
  estado_laboral VARCHAR(20) DEFAULT 'ACTIVO',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_agencia_base) REFERENCES agencias(id_agencia) ON DELETE SET NULL
);

-- 6. Empleados_Roles (Intermedia para múltiple asignación)
DROP TABLE IF EXISTS empleados_roles CASCADE;
CREATE TABLE empleados_roles (
  id_empleado BIGINT NOT NULL,
  id_rol BIGINT NOT NULL,
  PRIMARY KEY (id_empleado, id_rol),
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
);

-- 7. Areas_Restringidas
DROP TABLE IF EXISTS areas_restringidas CASCADE;
CREATE TABLE areas_restringidas (
  id_area BIGSERIAL PRIMARY KEY,
  id_agencia BIGINT,
  nombre VARCHAR(100) NOT NULL,
  nivel_riesgo VARCHAR(50) NOT NULL,
  id_permiso_requerido BIGINT,
  estado BOOLEAN DEFAULT true,
  FOREIGN KEY (id_agencia) REFERENCES agencias(id_agencia) ON DELETE CASCADE,
  FOREIGN KEY (id_permiso_requerido) REFERENCES permisos(id_permiso) ON DELETE SET NULL
);

-- 8. Empleados_Areas (Excepciones y restricciones horarias por área)
DROP TABLE IF EXISTS empleados_areas CASCADE;
CREATE TABLE empleados_areas (
  id BIGSERIAL PRIMARY KEY,
  id_empleado BIGINT NOT NULL,
  id_area BIGINT NOT NULL,
  dia_semana INTEGER,
  horario_inicio TIME,
  horario_fin TIME,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  FOREIGN KEY (id_area) REFERENCES areas_restringidas(id_area) ON DELETE CASCADE
);

-- 9. Dispositivos_Escaneo
DROP TABLE IF EXISTS dispositivos_escaneo CASCADE;
CREATE TABLE dispositivos_escaneo (
  id_dispositivo BIGSERIAL PRIMARY KEY,
  id_area BIGINT,
  identificador_equipo VARCHAR(100) NOT NULL UNIQUE,
  mac_address VARCHAR(50),
  estado BOOLEAN DEFAULT true,
  ultima_sincronizacion TIMESTAMP,
  FOREIGN KEY (id_area) REFERENCES areas_restringidas(id_area) ON DELETE SET NULL
);

-- 10. Bitacora_Accesos (Registros Accesso)
DROP TABLE IF EXISTS bitacora_accesos CASCADE;
CREATE TABLE bitacora_accesos (
  id_bitacora BIGSERIAL PRIMARY KEY,
  id_empleado BIGINT,
  id_area BIGINT,
  id_dispositivo BIGINT,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo_movimiento VARCHAR(10) DEFAULT 'IN',
  resultado VARCHAR(20) NOT NULL,
  motivo TEXT,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  FOREIGN KEY (id_area) REFERENCES areas_restringidas(id_area) ON DELETE CASCADE,
  FOREIGN KEY (id_dispositivo) REFERENCES dispositivos_escaneo(id_dispositivo) ON DELETE SET NULL
);

-- 11. Alertas_Seguridad (ITIL)
DROP TABLE IF EXISTS alertas_seguridad CASCADE;
CREATE TABLE alertas_seguridad (
  id_alerta BIGSERIAL PRIMARY KEY,
  id_bitacora_asociada BIGINT,
  tipo_alerta VARCHAR(100) NOT NULL,
  estado VARCHAR(50) DEFAULT 'ABIERTA',
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_bitacora_asociada) REFERENCES bitacora_accesos(id_bitacora) ON DELETE CASCADE
);
