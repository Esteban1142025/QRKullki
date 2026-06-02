SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Base de datos: `kullkidb`

-- 1. Agencias
DROP TABLE IF EXISTS `agencias`;
CREATE TABLE IF NOT EXISTS `agencias` (
  `id_agencia` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_agencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Permisos (RBAC Dinámico)
DROP TABLE IF EXISTS `permisos`;
CREATE TABLE IF NOT EXISTS `permisos` (
  `id_permiso` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo_permiso` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `codigo_permiso` (`codigo_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Roles
DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Roles_Permisos (Intermedia)
DROP TABLE IF EXISTS `roles_permisos`;
CREATE TABLE IF NOT EXISTS `roles_permisos` (
  `id_rol` bigint UNSIGNED NOT NULL,
  `id_permiso` bigint UNSIGNED NOT NULL,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE,
  FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Empleados
DROP TABLE IF EXISTS `empleados`;
CREATE TABLE IF NOT EXISTS `empleados` (
  `id_empleado` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_agencia_base` bigint UNSIGNED DEFAULT NULL,
  `identificacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totp_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL, -- QR Dinámico
  `estado_laboral` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVO',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `identificacion` (`identificacion`),
  UNIQUE KEY `email` (`email`),
  FOREIGN KEY (`id_agencia_base`) REFERENCES `agencias` (`id_agencia`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Empleados_Roles (Intermedia para múltiple asignación)
DROP TABLE IF EXISTS `empleados_roles`;
CREATE TABLE IF NOT EXISTS `empleados_roles` (
  `id_empleado` bigint UNSIGNED NOT NULL,
  `id_rol` bigint UNSIGNED NOT NULL,
  PRIMARY KEY (`id_empleado`, `id_rol`),
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Areas_Restringidas
DROP TABLE IF EXISTS `areas_restringidas`;
CREATE TABLE IF NOT EXISTS `areas_restringidas` (
  `id_area` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_agencia` bigint UNSIGNED DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel_riesgo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_permiso_requerido` bigint UNSIGNED DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_area`),
  FOREIGN KEY (`id_agencia`) REFERENCES `agencias` (`id_agencia`) ON DELETE CASCADE,
  FOREIGN KEY (`id_permiso_requerido`) REFERENCES `permisos` (`id_permiso`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Empleados_Areas (Excepciones y restricciones horarias por área)
DROP TABLE IF EXISTS `empleados_areas`;
CREATE TABLE IF NOT EXISTS `empleados_areas` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_empleado` bigint UNSIGNED NOT NULL,
  `id_area` bigint UNSIGNED NOT NULL,
  `dia_semana` int DEFAULT NULL,
  `horario_inicio` time DEFAULT NULL,
  `horario_fin` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  FOREIGN KEY (`id_area`) REFERENCES `areas_restringidas` (`id_area`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Dispositivos_Escaneo
DROP TABLE IF EXISTS `dispositivos_escaneo`;
CREATE TABLE IF NOT EXISTS `dispositivos_escaneo` (
  `id_dispositivo` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_area` bigint UNSIGNED DEFAULT NULL,
  `identificador_equipo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mac_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `ultima_sincronizacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_dispositivo`),
  UNIQUE KEY `identificador_equipo` (`identificador_equipo`),
  FOREIGN KEY (`id_area`) REFERENCES `areas_restringidas` (`id_area`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bitacora_Accesos (Registros Accesso)
DROP TABLE IF EXISTS `bitacora_accesos`;
CREATE TABLE IF NOT EXISTS `bitacora_accesos` (
  `id_bitacora` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_empleado` bigint UNSIGNED DEFAULT NULL,
  `id_area` bigint UNSIGNED DEFAULT NULL,
  `id_dispositivo` bigint UNSIGNED DEFAULT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_movimiento` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'IN',
  `resultado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL, -- CONCEDIDO / DENEGADO
  `motivo` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_bitacora`),
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  FOREIGN KEY (`id_area`) REFERENCES `areas_restringidas` (`id_area`) ON DELETE CASCADE,
  FOREIGN KEY (`id_dispositivo`) REFERENCES `dispositivos_escaneo` (`id_dispositivo`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Alertas_Seguridad (ITIL)
DROP TABLE IF EXISTS `alertas_seguridad`;
CREATE TABLE IF NOT EXISTS `alertas_seguridad` (
  `id_alerta` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_bitacora_asociada` bigint UNSIGNED DEFAULT NULL,
  `tipo_alerta` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ABIERTA',
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alerta`),
  FOREIGN KEY (`id_bitacora_asociada`) REFERENCES `bitacora_accesos` (`id_bitacora`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
