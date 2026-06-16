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

-- ============================================
-- DATOS INICIALES PARA PRUEBAS
-- ============================================

-- Insertar Agencia
INSERT INTO agencias (nombre, direccion, estado) VALUES ('MAT', 'Matriz Principal', true);

-- Insertar Permisos
INSERT INTO permisos (codigo_permiso, descripcion) VALUES 
  ('acceso_total', 'Acceso a todo el sistema y áreas'),
  ('acceso_boveda', 'Acceso a la Bóveda Principal'),
  ('acceso_cajas', 'Acceso al Área de Cajas'),
  ('ver_reportes', 'Ver reportes de accesos'),
  ('gestionar_usuarios', 'Crear y editar empleados');

-- Insertar Roles
INSERT INTO roles (nombre, descripcion, activo) VALUES 
  ('admin', 'Administrador del sistema', true),
  ('empleado', 'Usuario regular (Cajero)', true),
  ('talento_humano', 'Gestión de talento humano', true),
  ('riesgos', 'Oficial de riesgos', true),
  ('seguridad_fisica', 'Seguridad física', true),
  ('auditor', 'Auditor interno', true),
  ('jefe_agencia', 'Jefe de agencia', true),
  ('tecnico_ti', 'Técnico de TI', true);

-- Asignar Permisos a Roles
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'admin' AND p.codigo_permiso IN ('acceso_total', 'gestionar_usuarios');

INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'empleado' AND p.codigo_permiso = 'acceso_cajas';

-- Permisos para talento_humano
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'talento_humano' AND p.codigo_permiso = 'gestionar_usuarios';

-- Permisos para riesgos
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'riesgos' AND p.codigo_permiso IN ('acceso_boveda', 'ver_reportes');

-- Permisos para seguridad_fisica
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'seguridad_fisica' AND p.codigo_permiso IN ('acceso_boveda', 'ver_reportes');

-- Permisos para auditor
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'auditor' AND p.codigo_permiso = 'ver_reportes';

-- Permisos para jefe_agencia
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'jefe_agencia' AND p.codigo_permiso = 'acceso_cajas';

-- Permisos para tecnico_ti
INSERT INTO roles_permisos (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM roles r, permisos p 
WHERE r.nombre = 'tecnico_ti' AND p.codigo_permiso = 'ver_reportes';

-- Insertar Usuarios de Prueba (contraseñas en texto plano para desarrollo)
-- NOTA: En producción usar contraseñas hasheadas con bcrypt
INSERT INTO empleados (identificacion, nombres, apellidos, email, id_agencia_base, password_hash, estado_laboral) VALUES 
  ('0987654321', 'Carlos', 'Ruiz', 'carlos.ruiz@kullkiwasi.com', 1, 'admin123', 'ACTIVO'),
  ('1712345678', 'Maria', 'Garcia', 'maria.garcia@kullkiwasi.com', 1, 'empleado123', 'ACTIVO'),
  ('1234567890', 'Juan', 'Pérez', 'juan.perez@kullkiwasi.com', 1, 'talento123', 'ACTIVO'),
  ('2345678901', 'Ana', 'López', 'ana.lopez@kullkiwasi.com', 1, 'riesgos123', 'ACTIVO'),
  ('3456789012', 'Carlos', 'Mendoza', 'carlos.mendoza@kullkiwasi.com', 1, 'seguridad123', 'ACTIVO'),
  ('4567890123', 'María', 'Torres', 'maria.torres@kullkiwasi.com', 1, 'auditor123', 'ACTIVO'),
  ('5678901234', 'Roberto', 'Sánchez', 'roberto.sanchez@kullkiwasi.com', 1, 'jefe123', 'ACTIVO'),
  ('6789012345', 'Luis', 'Ramírez', 'luis.ramirez@kullkiwasi.com', 1, 'tecnico123', 'ACTIVO');

-- Asignar Roles a Usuarios
INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '0987654321' AND r.nombre = 'admin';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '1712345678' AND r.nombre = 'empleado';

-- Asignar roles a nuevos usuarios
INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '1234567890' AND r.nombre = 'talento_humano';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '2345678901' AND r.nombre = 'riesgos';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '3456789012' AND r.nombre = 'seguridad_fisica';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '4567890123' AND r.nombre = 'auditor';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '5678901234' AND r.nombre = 'jefe_agencia';

INSERT INTO empleados_roles (id_empleado, id_rol) 
SELECT e.id_empleado, r.id_rol 
FROM empleados e, roles r 
WHERE e.identificacion = '6789012345' AND r.nombre = 'tecnico_ti';
