-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 19-05-2026 a las 17:19:11
-- Versión del servidor: 8.4.7
-- Versión de PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `kullkidb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agencias`
--

DROP TABLE IF EXISTS `agencias`;
CREATE TABLE IF NOT EXISTS `agencias` (
  `id_agencia` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_agencia`),
  UNIQUE KEY `id_agencia` (`id_agencia`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `areas_restringidas`
--

DROP TABLE IF EXISTS `areas_restringidas`;
CREATE TABLE IF NOT EXISTS `areas_restringidas` (
  `id_area` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_agencia` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel_riesgo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_area`),
  UNIQUE KEY `id_area` (`id_area`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora_accesos`
--

DROP TABLE IF EXISTS `bitacora_accesos`;
CREATE TABLE IF NOT EXISTS `bitacora_accesos` (
  `id_bitacora` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_empleado` int DEFAULT NULL,
  `id_area` int DEFAULT NULL,
  `id_dispositivo` int DEFAULT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resultado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_bitacora`),
  UNIQUE KEY `id_bitacora` (`id_bitacora`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dispositivos_escaneo`
--

DROP TABLE IF EXISTS `dispositivos_escaneo`;
CREATE TABLE IF NOT EXISTS `dispositivos_escaneo` (
  `id_dispositivo` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_area` int DEFAULT NULL,
  `identificador_equipo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_dispositivo`),
  UNIQUE KEY `id_dispositivo` (`id_dispositivo`),
  UNIQUE KEY `identificador_equipo` (`identificador_equipo`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

DROP TABLE IF EXISTS `empleados`;
CREATE TABLE IF NOT EXISTS `empleados` (
  `id_empleado` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rol` int DEFAULT NULL,
  `id_agencia_base` int DEFAULT NULL,
  `identificacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_qr` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_laboral` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `id_empleado` (`id_empleado`),
  UNIQUE KEY `identificacion` (`identificacion`),
  UNIQUE KEY `token_qr` (`token_qr`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios_empleados`
--

DROP TABLE IF EXISTS `horarios_empleados`;
CREATE TABLE IF NOT EXISTS `horarios_empleados` (
  `id_horario` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_empleado` int DEFAULT NULL,
  `dia_semana` int NOT NULL,
  `horario_inicio` time NOT NULL,
  `horario_fin` time NOT NULL,
  PRIMARY KEY (`id_horario`),
  UNIQUE KEY `id_horario` (`id_horario`),
  UNIQUE KEY `id_empleado` (`id_empleado`,`dia_semana`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos_acceso`
--

DROP TABLE IF EXISTS `permisos_acceso`;
CREATE TABLE IF NOT EXISTS `permisos_acceso` (
  `id_permiso` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rol` int DEFAULT NULL,
  `id_area` int DEFAULT NULL,
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `id_permiso` (`id_permiso`),
  UNIQUE KEY `id_rol` (`id_rol`,`id_area`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `id_rol` (`id_rol`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
