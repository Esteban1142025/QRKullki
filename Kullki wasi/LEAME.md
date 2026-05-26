# Guía Rápida — Cooperativa Kullki Wasi

Este directorio contiene el **Sistema Automatizado de Control de Accesos y Trazabilidad de Personal** desarrollado en **React JS + Vite**.

## 🚀 Ejecución en Desarrollo
Para iniciar la aplicación localmente, ejecute en su terminal:

```bash
npm run dev
```

Esto levantará el servidor web de Vite en http://localhost:5173.

## 👥 Cuentas de Prueba e Inicio de Sesión
El sistema simula **8 roles institucionales**. En la pantalla de inicio de sesión (/login), a la izquierda, encontrará un panel rápido con botones para iniciar sesión al instante con cualquiera de ellos:
1. **Administrador General**
2. **Talento Humano**
3. **Oficial de Riesgos**
4. **Seguridad Física**
5. **Auditor Interno**
6. **Jefe de Agencia**
7. **Técnico TI**
8. **Empleado**

También puede alternar los roles en cualquier momento usando el botón flotante **"Cambiar Rol"** ubicado en la esquina inferior derecha.

## 📂 Estructura Preparada (FastAPI + Postgres + Docker)
* `/backend`: Contiene el código FastAPI, esquemas de tablas SQLAlchemy para Postgres y el Dockerfile del backend.
* `Dockerfile`: Configurado para empaquetar el frontend con Node y Nginx.
* `docker-compose.yml`: Conexión de servicios frontend, backend y base de datos local.
