-- Script SQL para PostgreSQL
-- Base de datos: kullki_wasi_db

-- 1. Agencias
DROP TABLE IF EXISTS agencias CASCADE;
CREATE TABLE agencias (
  id_agencia BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(10),
  direccion TEXT,
  telefono VARCHAR(20),
  tipo VARCHAR(30) DEFAULT 'Sucursal',
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
  departamento VARCHAR(100),
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
  horario VARCHAR(50) DEFAULT '08:00 - 18:00',
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
  ip_address VARCHAR(50),
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

-- Insertar Agencias
INSERT INTO agencias (nombre, codigo, direccion, tipo, estado) VALUES
  ('Matriz Ambato',       'MAT', 'Av. Cevallos y Lalama, Ambato',            'Principal', true),
  ('Agencia Pelileo',     'PEL', 'Av. 22 de Julio y Garcia Moreno, Pelileo', 'Sucursal',  true),
  ('Agencia Pillaro',     'PIL', 'Bolivar y Padre Chacon, Pillaro',           'Sucursal',  true),
  ('Agencia Banos',       'BAN', 'Ambato y Rocafuerte, Banos de Agua Santa',  'Sucursal',  true),
  ('Agencia Salcedo',     'SAL', 'Sucre y 24 de Mayo, Salcedo',               'Sucursal',  true),
  ('Agencia Quisapincha', 'QUI', 'Parroquia Quisapincha, Ambato',             'Extensión', true);

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

-- Insertar Usuarios (contraseñas hasheadas con bcrypt)
-- Agencia MAT — 8 roles completos
INSERT INTO empleados (identificacion, nombres, apellidos, email, id_agencia_base, password_hash, estado_laboral, departamento) VALUES
  ('0987654321', 'Administrador', 'del Sistema',  'admin@kullkiwasi.fin.ec',              1, '$2b$12$4Cjqvgp2kbLVPAxzNx9ut.yLUhFUXpDBHqKqNGFsLg8iRbs4FEHGa', 'ACTIVO', 'Administracion General'),
  ('1712345678', 'Maria',         'Garcia',        'maria.garcia@kullkiwasi.com',          1, '$2b$12$cNA0JSbyRD2yzLvecAmxVutnaEGhqq91Hl1pBHl8Td.vUIAgayBqi', 'ACTIVO', 'Caja y Servicios'),
  ('1234567890', 'Juan',          'Perez',         'juan.perez@kullkiwasi.com',            1, '$2b$12$4QXi.oXlcmC5btTRpWm7z..E.FNkqOHvn3oJtRh0CJTTifxp40oqC', 'ACTIVO', 'Talento Humano'),
  ('2345678901', 'Ana',           'Lopez',         'ana.lopez@kullkiwasi.com',             1, '$2b$12$nPGRqHWuhG7SuNqdNVknjOAsLt.ZbqArBsYI8sXY/ajxlkbk.61Mm', 'ACTIVO', 'Gestion de Riesgos'),
  ('3456789012', 'Carlos',        'Mendoza',       'carlos.mendoza@kullkiwasi.com',        1, '$2b$12$JLkG3199kWyJIGGOTyUnAuvVu6NTRCedmKOfFFY7Un/8lO2Oig9Ma', 'ACTIVO', 'Seguridad y Vigilancia'),
  ('4567890123', 'Maria',         'Torres',        'maria.torres@kullkiwasi.com',          1, '$2b$12$bAoFVN6c95.mn0g5GhG8xO3Ex1I2VDqUT.qPW.nVQL0vii0cjkoKS', 'ACTIVO', 'Auditoria Interna'),
  ('5678901234', 'Roberto',       'Sanchez',       'roberto.sanchez@kullkiwasi.com',       1, '$2b$12$ARKoMnctmh0oZ3IrlGRLSORi64DiG.fXo9FvY11uC6ns5vZjT3WMG', 'ACTIVO', 'Operaciones Financieras'),
  ('6789012345', 'Luis',          'Ramirez',       'luis.ramirez@kullkiwasi.com',          1, '$2b$12$8ORSo0uNL9uWgSMNjjgUhuvfLDM5cX81WaRSl78chwRu4xArzF1UO', 'ACTIVO', 'Tecnologia e Informacion');

-- Jefes de agencia por sucursal (contraseña: jefe.CODIGO2026)
INSERT INTO empleados (identificacion, nombres, apellidos, email, id_agencia_base, password_hash, estado_laboral, departamento) VALUES
  ('1800000001', 'Marco Antonio',    'Cepeda Vargas',  'marco.cepeda@kullkiwasi.fin.ec',   (SELECT id_agencia FROM agencias WHERE codigo='PEL'), '$2b$12$To5.ZaoBxJm7KVQnEmMA1.VqtkxVZGuMN0NmoJKmIYrFGA9D9/FU2', 'ACTIVO', 'Operaciones Financieras'),
  ('1800000002', 'Diana Patricia',   'Flores Nunez',   'diana.flores@kullkiwasi.fin.ec',   (SELECT id_agencia FROM agencias WHERE codigo='PIL'), '$2b$12$fGFcJaPKFdSS2fhMUST2j.tQ4BQzviVJV6e8GpIoI8rG9atxgoH3K', 'ACTIVO', 'Operaciones Financieras'),
  ('1800000003', 'Rodrigo Sebastian','Mora Hidalgo',   'rodrigo.mora@kullkiwasi.fin.ec',   (SELECT id_agencia FROM agencias WHERE codigo='BAN'), '$2b$12$teXaHT4LkwVZSvz0r75E2OFFDdmLGeCJEslb8MkoawoVG1cXVQ2Hu', 'ACTIVO', 'Operaciones Financieras'),
  ('1800000004', 'Elena Beatriz',    'Chavez Salazar', 'elena.chavez@kullkiwasi.fin.ec',   (SELECT id_agencia FROM agencias WHERE codigo='SAL'), '$2b$12$O01v7cbEDiicTA.Gf2pOVuWALaENicWvJW/cZbwUTf1YyvElUMjIm', 'ACTIVO', 'Operaciones Financieras'),
  ('1800000005', 'Fernando Alexis',  'Tello Orozco',   'fernando.tello@kullkiwasi.fin.ec', (SELECT id_agencia FROM agencias WHERE codigo='QUI'), '$2b$12$nr10s8MsHtJEDZ5NmN6o.eStf72b.6RLZSlrfponw0z9p8wY0hSdK', 'ACTIVO', 'Operaciones Financieras');

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

-- Roles para jefes de sucursales
INSERT INTO empleados_roles (id_empleado, id_rol)
SELECT e.id_empleado, r.id_rol FROM empleados e, roles r
WHERE e.identificacion IN ('1800000001','1800000002','1800000003','1800000004','1800000005')
  AND r.nombre = 'jefe_agencia';

-- ============================================
-- AREAS CRITICAS
-- ============================================

-- MAT — Matriz Ambato (7 areas)
INSERT INTO areas_restringidas (id_agencia, nombre, nivel_riesgo, horario, estado, id_permiso_requerido) VALUES
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Boveda Principal',            'Critico', '24/7',          true, (SELECT id_permiso FROM permisos WHERE codigo_permiso='acceso_boveda')),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Cuarto de Servidores TI',     'Alto',    '08:00 - 22:00', true, (SELECT id_permiso FROM permisos WHERE codigo_permiso='acceso_total')),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Area de Cajas',               'Alto',    '08:00 - 18:00', true, (SELECT id_permiso FROM permisos WHERE codigo_permiso='acceso_cajas')),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Archivo General e Historico', 'Medio',   '08:00 - 17:00', true, (SELECT id_permiso FROM permisos WHERE codigo_permiso='ver_reportes')),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Oficinas Administrativas',    'Critico', '07:00 - 19:00', true, (SELECT id_permiso FROM permisos WHERE codigo_permiso='acceso_total')),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Parqueadero Institucional',   'Bajo',    '06:00 - 22:00', true, NULL),
  ((SELECT id_agencia FROM agencias WHERE codigo='MAT'), 'Sala de Marketing',           'Medio',   '08:00 - 18:00', true, NULL);

-- Sucursales — un acceso principal por agencia
INSERT INTO areas_restringidas (id_agencia, nombre, nivel_riesgo, horario, estado) VALUES
  ((SELECT id_agencia FROM agencias WHERE codigo='PEL'), 'Acceso Principal Pelileo',     'Medio', '08:00 - 18:00', true),
  ((SELECT id_agencia FROM agencias WHERE codigo='PIL'), 'Acceso Principal Pillaro',     'Medio', '08:00 - 18:00', true),
  ((SELECT id_agencia FROM agencias WHERE codigo='BAN'), 'Acceso Principal Banos',       'Medio', '08:00 - 18:00', true),
  ((SELECT id_agencia FROM agencias WHERE codigo='SAL'), 'Acceso Principal Salcedo',     'Medio', '08:00 - 18:00', true),
  ((SELECT id_agencia FROM agencias WHERE codigo='QUI'), 'Acceso Principal Quisapincha', 'Medio', '08:00 - 17:00', true);

-- ============================================
-- DISPOSITIVOS QR (un lector por area)
-- ============================================

INSERT INTO dispositivos_escaneo (id_area, identificador_equipo, mac_address, ip_address, estado) VALUES
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Boveda Principal'),            'LECTOR-MAT-BOVEDA-01',      'AA:BB:CC:01:01:01', '192.168.10.11', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Cuarto de Servidores TI'),     'LECTOR-MAT-SERVIDORES-01',  'AA:BB:CC:01:01:02', '192.168.10.12', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Area de Cajas'),               'LECTOR-MAT-CAJAS-01',       'AA:BB:CC:01:01:03', '192.168.10.13', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Archivo General e Historico'), 'LECTOR-MAT-ARCHIVO-01',     'AA:BB:CC:01:01:04', '192.168.10.14', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Oficinas Administrativas'),    'LECTOR-MAT-OFICINAS-01',    'AA:BB:CC:01:01:05', '192.168.10.15', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Parqueadero Institucional'),   'LECTOR-MAT-PARQUEADERO-01', 'AA:BB:CC:01:01:06', '192.168.10.16', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Sala de Marketing'),           'LECTOR-MAT-MARKETING-01',   'AA:BB:CC:01:01:07', '192.168.10.17', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Acceso Principal Pelileo'),     'LECTOR-PEL-ACCESO-01',      'AA:BB:CC:02:01:01', '192.168.20.11', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Acceso Principal Pillaro'),     'LECTOR-PIL-ACCESO-01',      'AA:BB:CC:03:01:01', '192.168.30.11', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Acceso Principal Banos'),       'LECTOR-BAN-ACCESO-01',      'AA:BB:CC:04:01:01', '192.168.40.11', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Acceso Principal Salcedo'),     'LECTOR-SAL-ACCESO-01',      'AA:BB:CC:05:01:01', '192.168.50.11', true),
  ((SELECT id_area FROM areas_restringidas WHERE nombre='Acceso Principal Quisapincha'), 'LECTOR-QUI-ACCESO-01',      'AA:BB:CC:06:01:01', '192.168.60.11', true);
