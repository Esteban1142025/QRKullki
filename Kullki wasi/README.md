# 🏦 Sistema de Control de Accesos — Kullki Wasi

Sistema automatizado de control de accesos físicos y trazabilidad de personal para la Cooperativa de Ahorro y Crédito Kullki Wasi Ltda., desarrollado bajo normativa SEPS Segmento 1.

**Stack tecnológico:** React + Vite (frontend), FastAPI + SQLAlchemy (backend), PostgreSQL (base de datos), Docker Compose (orquestación).

---

## 📁 Estructura del Proyecto

```
Kullki wasi/
├── frontend/               Aplicación React + Vite (interfaz de usuario, puerto 5173)
│   ├── Dockerfile          Build de producción con Nginx (NO USAR para desarrollo)
│   ├── Dockerfile.dev      Servidor de desarrollo Vite con hot-reload
│   ├── src/                Código fuente React
│   ├── package.json        Dependencias Node.js
│   └── vite.config.js      Configuración de Vite (puerto 5173)
├── backend/                API REST FastAPI + SQLAlchemy (servidor Python, puerto 3001)
│   ├── Dockerfile          Imagen Docker del backend
│   ├── main.py             Servidor FastAPI con todos los endpoints
│   ├── models.py           Modelos SQLAlchemy (ORM)
│   ├── database.py         Configuración de conexión a PostgreSQL
│   ├── seed_db.py          Script para poblar la BD con usuarios de prueba
│   └── requirements.txt    Dependencias Python
├── database/               Esquema SQL de PostgreSQL
│   └── kullkidb_postgres.sql  Esquema + datos iniciales (se ejecuta automáticamente)
├── docker-compose.yml      Orquestación de los 3 servicios (frontend, backend, db)
└── README.md
```

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta       | Versión mínima | Verificación                     | Descarga                                       |
|-------------------|---------------|----------------------------------|-------------------------------------------------|
| Docker Desktop    | 4.0+          | `docker --version`               | https://www.docker.com/products/docker-desktop  |
| Docker Compose    | 2.0+          | `docker compose version`         | Incluido en Docker Desktop                      |
| Git               | 2.0+          | `git --version`                  | https://git-scm.com/downloads                   |

> **⚠️ IMPORTANTE (Windows):** Docker Desktop debe estar **abierto y en ejecución** antes de ejecutar cualquier comando Docker. Verifica que el ícono de Docker aparezca en la barra de tareas y diga "Docker Desktop is running".

---

## 🚀 Instalación y Ejecución con Docker (Recomendado)

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Esteban1142025/QRKullki.git
cd QRKullki
cd "Kullki wasi"
```

### Paso 2 — Levantar todos los servicios

```bash
docker compose up --build
```

> **Primera ejecución:** Docker descargará las imágenes base (Node.js, Python, PostgreSQL) y compilará los contenedores. Tiempo estimado: **5-10 minutos** según la velocidad de internet.

Espera hasta ver en la terminal mensajes similares a:

```
kullki-wasi-db   | database system is ready to accept connections
backend-1        | Tablas de Base de Datos inicializadas.
backend-1        | Uvicorn running on http://0.0.0.0:3001
frontend-1       | VITE v5.x.x ready in xxx ms
frontend-1       | ➜ Local:   http://localhost:5173/
```

### Paso 3 — Poblar la base de datos con usuarios de prueba

En una **nueva terminal** (sin cerrar la anterior), ejecuta:

```bash
docker compose exec backend python seed_db.py
```

Deberías ver la salida:

```
Base de datos poblada con exito.
--- Credenciales de Prueba ---
Administrador    -> Cedula: 0987654321   | Pass: admin123
Empleado         -> Cedula: 1712345678   | Pass: empleado123
...
```

> **¿Por qué es necesario este paso?** El archivo SQL (`kullkidb_postgres.sql`) crea las tablas y datos iniciales, pero las contraseñas quedan en texto plano. El script `seed_db.py` genera los hashes bcrypt que el sistema necesita para autenticar correctamente. **Sin este paso, no podrás iniciar sesión.**

### Paso 4 — Acceder al sistema

Abre tu navegador y visita:

| Servicio              | URL                                 |
|-----------------------|-------------------------------------|
| **🖥️ Frontend**       | **http://localhost:5173**           |
| **⚙️ Backend API**    | http://localhost:3001               |
| **📄 Docs API (Swagger)** | http://localhost:3001/docs      |

> **⚠️ NOTA:** NO uses `http://localhost:3000`. El frontend funcional es el que se sirve en el puerto **5173** (servidor de desarrollo Vite). El puerto 3000 ya no se utiliza.

### Paso 5 — Iniciar sesión

Usa las siguientes credenciales de administrador para la primera prueba:

- **Cédula:** `0987654321`
- **Contraseña:** `admin123`

---

## 🛑 Detener y Reiniciar los Servicios

```bash
# Detener todos los servicios (mantiene los datos de la BD)
docker compose down

# Volver a iniciar (sin reconstruir)
docker compose up

# Reconstruir e iniciar (necesario si cambiaste dependencias o Dockerfiles)
docker compose up --build

# Eliminar TODO (incluidos datos de la BD) y reconstruir desde cero
docker compose down -v
docker compose up --build
# IMPORTANTE: tras "down -v" debes ejecutar seed_db.py de nuevo (Paso 3)
```

---

## 💻 Ejecución en Desarrollo Local (sin Docker)

Si prefieres ejecutar los servicios directamente en tu máquina:

### Requisitos adicionales

| Herramienta | Versión  | Verificación          |
|-------------|----------|-----------------------|
| Node.js     | 20+      | `node --version`      |
| npm         | 9+       | `npm --version`       |
| Python      | 3.10+    | `python --version`    |
| PostgreSQL  | 15+      | `psql --version`      |

### 1. Configurar la base de datos

```bash
# Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE USER kullki_user WITH PASSWORD 'kullki_pass';"
psql -U postgres -c "CREATE DATABASE kullki_wasi_db OWNER kullki_user;"

# Cargar el esquema y datos iniciales
psql -U kullki_user -d kullki_wasi_db -f database/kullkidb_postgres.sql
```

> **Nota:** Si PostgreSQL usa un puerto diferente al 5432, ajusta la variable `DATABASE_URL` en `backend/database.py`.

### 2. Iniciar el backend

```bash
cd backend
pip install -r requirements.txt
python seed_db.py
uvicorn main:app --host 0.0.0.0 --port 3001
```

El backend estará disponible en http://localhost:3001.

### 3. Iniciar el frontend

En una **nueva terminal**:

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en **http://localhost:5173**.

---

## 🔌 Puertos del Sistema

| Servicio    | Puerto (Docker) | Puerto (Local)  | Descripción                        |
|-------------|-----------------|------------------|------------------------------------|
| Frontend    | 5173            | 5173             | Servidor de desarrollo Vite        |
| Backend     | 3001            | 3001             | API REST FastAPI (uvicorn)         |
| PostgreSQL  | 5433            | 5432             | Base de datos PostgreSQL           |

> En Docker, PostgreSQL se expone en el puerto **5433** del host para evitar conflictos con una instancia local de PostgreSQL que podría estar usando el puerto 5432.

---

## 👥 Credenciales de Prueba

### Administrador General (Matriz Ambato)

| Rol           | Cédula       | Contraseña | Agencia       |
|---------------|-------------|------------|---------------|
| Administrador | 0987654321  | admin123   | Matriz Ambato |

### Usuarios por Rol

| Rol               | Cédula       | Contraseña    | Módulos accesibles                                    |
|-------------------|-------------|---------------|-------------------------------------------------------|
| Empleado          | 1712345678  | empleado123   | Dashboard personal y perfil                           |
| Talento Humano    | 1234567890  | talento123    | Gestión de empleados y credenciales QR                |
| Oficial Riesgos   | 2345678901  | riesgos123    | Consola de alertas e incidentes de seguridad          |
| Seguridad Física  | 3456789012  | seguridad123  | Alertas, control QR y áreas críticas                  |
| Auditor Interno   | 4567890123  | auditor123    | Módulo de auditoría y bitácora de accesos             |
| Jefe de Agencia   | 5678901234  | jefe123       | Dashboard, agencias y empleados de su agencia         |
| Técnico TI        | 6789012345  | tecnico123    | Dispositivos de escaneo y configuración del sistema   |

### Administradores por Agencia

Cada agencia tiene su propio administrador. Contraseña uniforme: `Admin2024.`

| Agencia             | Código | Cédula       | Email                               |
|---------------------|--------|-------------|-------------------------------------|
| Agencia Pelileo     | PEL    | 1800000001  | admin.pelileo@kullkiwasi.fin.ec     |
| Agencia Píllaro     | PIL    | 1800000002  | admin.pillaro@kullkiwasi.fin.ec     |
| Agencia Baños       | BAN    | 1800000003  | admin.banos@kullkiwasi.fin.ec       |
| Agencia Salcedo     | SAL    | 1800000004  | admin.salcedo@kullkiwasi.fin.ec     |
| Agencia Quisapincha | QUI    | 1800000005  | admin.quisapincha@kullkiwasi.fin.ec |

### Descripción de roles y permisos (RBAC)

- **Administrador**: acceso irrestricto a todos los módulos, configuración global, gestión de usuarios y respaldo de datos.
- **Empleado**: visualiza únicamente las áreas críticas a las que tiene permiso según su rol institucional.
- **Talento Humano**: crea, edita y desactiva cuentas de empleados; gestiona las credenciales QR institucionales.
- **Oficial Riesgos**: revisa y actualiza el estado de las alertas de seguridad (Abierta, En Investigación, Resuelta).
- **Seguridad Física**: opera el lector QR para validar accesos y gestiona alertas activas.
- **Auditor Interno**: genera informes de auditoría, revisa la bitácora completa de accesos y exporta reportes PDF/Excel.
- **Jefe de Agencia**: supervisa el dashboard de su agencia y el personal asignado a ella.
- **Técnico TI**: administra los dispositivos de escaneo QR registrados en el sistema.

---

## 🔧 Comandos Útiles de Docker

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs en tiempo real (todos los servicios)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Reiniciar un servicio individual
docker compose restart backend

# Ejecutar un comando dentro del contenedor backend
docker compose exec backend python seed_db.py

# Acceder a la consola de PostgreSQL
docker compose exec db psql -U kullki_user -d kullki_wasi_db
```

---

## 🐛 Solución de Problemas

### "port is already in use"

Otro servicio ocupa el puerto 5173, 3001 o 5433. Soluciones:

```bash
# Windows: encontrar qué proceso usa el puerto (ejemplo puerto 5173)
netstat -ano | findstr :5173
# Luego terminar el proceso con su PID
taskkill /PID <PID> /F

# O cambiar los puertos en docker-compose.yml (sección "ports")
```

### No puedo iniciar sesión (credenciales incorrectas)

Ejecuta el script de seed para generar las contraseñas hasheadas con bcrypt:

```bash
docker compose exec backend python seed_db.py
```

Si la base de datos ya tenía datos previos y da error de duplicados, reconstruye desde cero:

```bash
docker compose down -v
docker compose up --build
# Esperar a que los 3 servicios estén listos, luego:
docker compose exec backend python seed_db.py
```

### "failed to solve: npm run build" o error de build del frontend

- Actualiza Docker Desktop a la última versión.
- El proyecto requiere Node.js 20 o superior.

### "service db is not running" o error de conexión a PostgreSQL

```bash
# Revisar los logs de la base de datos
docker compose logs db

# Si el archivo SQL tiene errores, verificar:
# database/kullkidb_postgres.sql
```

### El frontend no carga o muestra pantalla en blanco

1. Verifica que estás accediendo a **http://localhost:5173** (NO al puerto 3000).
2. Revisa la consola del navegador (F12 → Console) para ver errores de red.
3. Verifica que el backend esté corriendo: abre http://localhost:3001/docs.

### Los cambios en el código no se reflejan

El servidor de desarrollo Vite tiene **hot-reload automático**. Si los cambios no aparecen:

```bash
# Reiniciar el frontend
docker compose restart frontend

# Si cambiaste dependencias (package.json), reconstruir
docker compose up --build frontend
```

### "Docker daemon is not running" (Windows)

Abre Docker Desktop desde el menú inicio y espera a que se inicialice completamente antes de ejecutar comandos Docker.

---

## 📋 Resumen Rápido (Copiar y Pegar)

Para levantar el proyecto completo desde cero en **4 comandos**:

```bash
git clone https://github.com/Esteban1142025/QRKullki.git
cd QRKullki/"Kullki wasi"
docker compose up --build
# (En otra terminal, cuando los servicios estén listos:)
docker compose exec backend python seed_db.py
```

Luego abre **http://localhost:5173** e inicia sesión con cédula `0987654321` y contraseña `admin123`.
