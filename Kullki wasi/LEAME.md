# Guía Rápida — Cooperativa Kullki Wasi

Este directorio contiene el **Sistema Automatizado de Control de Accesos y Trazabilidad de Personal** desarrollado en **React JS + Vite**.

## 📂 Estructura del Proyecto

```
Kullki wasi/
├── frontend/       → Aplicación React + Vite (interfaz de usuario)
├── backend/        → API FastAPI + SQLAlchemy (servidor Python)
├── database/       → Scripts SQL de la base de datos MySQL
├── docker-compose.yml
└── LEAME.md
```

## 🚀 Ejecución en Desarrollo

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Esto levantará el servidor web de Vite en http://localhost:5173.

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3001
```

### Base de Datos (MySQL)
Importar el archivo `database/kullkidb.sql` en un servidor MySQL.

### Docker (todo junto)
```bash
docker-compose up --build
```

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

## 📂 Detalle de Carpetas

* `/frontend`: Contiene la aplicación React + Vite, incluyendo `src/`, `index.html`, `package.json`, `vite.config.js`, Dockerfile y configuración Nginx.
* `/backend`: Contiene el código FastAPI, esquemas de tablas SQLAlchemy para MySQL y el Dockerfile del backend.
* `/database`: Contiene los scripts SQL para crear la estructura de la base de datos.
* `Dockerfile` (frontend): Configurado para empaquetar el frontend con Node y Nginx.
* `docker-compose.yml`: Conexión de servicios frontend, backend y base de datos local.
