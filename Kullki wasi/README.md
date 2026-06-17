# Sistema de Control de Accesos — Kullki Wasi

Sistema automatizado de control de accesos fisicos y trazabilidad de personal para la Cooperativa de Ahorro y Credito Kullki Wasi Ltda., desarrollado bajo normativa SEPS Segmento 1.

Stack: React + Vite (frontend), FastAPI + SQLAlchemy (backend), PostgreSQL (base de datos), Docker Compose (orquestacion).

---

## Estructura del Proyecto

```
Kullki wasi/
├── frontend/          Aplicacion React + Vite (interfaz de usuario, puerto 3000)
├── backend/           API REST FastAPI + SQLAlchemy (servidor Python, puerto 3001)
├── database/          Esquema SQL de PostgreSQL (kullkidb_postgres.sql)
├── docker-compose.yml Orquestacion de los 3 servicios
└── README.md
```

---

## Requisitos Previos

- Docker Desktop instalado y en ejecucion
- Git instalado
- Navegador web moderno (Chrome, Firefox, Edge)

---

## Instalacion y Ejecucion con Docker

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd "Kullki wasi"
```

### 2. Levantar todos los servicios

```bash
docker-compose up --build
```

En la primera ejecucion descarga las imagenes base y compila el proyecto. Tiempo estimado: 5-10 minutos segun conexion a internet.

### 3. Acceder al sistema

| Servicio          | URL                          |
|-------------------|------------------------------|
| Frontend          | http://localhost:3000        |
| Backend API       | http://localhost:3001        |
| Documentacion API | http://localhost:3001/docs   |

---

## Ejecucion en Desarrollo Local (sin Docker)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Levanta Vite en http://localhost:5173.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3001
```

Requiere PostgreSQL disponible en el puerto 5433. Ajustar la cadena de conexion en `backend/database.py` si es necesario.

---

## Puertos del Sistema

| Servicio    | Puerto externo | Puerto interno |
|-------------|---------------|----------------|
| Frontend    | 3000          | 80 (nginx)     |
| Backend     | 3001          | 3001 (uvicorn) |
| PostgreSQL  | 5433          | 5432           |

---

## Usuarios del Sistema

### Administrador General (Matriz Ambato)

| Rol               | Cedula       | Contrasena    | Agencia        | Modulos accesibles                                      |
|-------------------|--------------|---------------|----------------|---------------------------------------------------------|
| Administrador     | 0987654321   | admin123      | Matriz Ambato  | Todos los modulos y configuracion del sistema           |

### Administradores por Agencia

Cada agencia tiene su propio administrador con acceso completo al sistema dentro de su agencia. Contrasena uniforme para todos: `Admin2024.`

| Agencia           | Codigo | Cedula       | Contrasena  | Email                               |
|-------------------|--------|--------------|-------------|-------------------------------------|
| Agencia Pelileo   | PEL    | 1800000001   | Admin2024.  | admin.pelileo@kullkiwasi.fin.ec     |
| Agencia Pillaro   | PIL    | 1800000002   | Admin2024.  | admin.pillaro@kullkiwasi.fin.ec     |
| Agencia Banos     | BAN    | 1800000003   | Admin2024.  | admin.banos@kullkiwasi.fin.ec       |
| Agencia Salcedo   | SAL    | 1800000004   | Admin2024.  | admin.salcedo@kullkiwasi.fin.ec     |
| Agencia Quisapincha | QUI  | 1800000005   | Admin2024.  | admin.quisapincha@kullkiwasi.fin.ec |

> Nota: El modulo "Roles y Permisos" muestra unicamente las areas criticas de la agencia en la que el administrador se encuentra logueado.

### Usuarios de Prueba por Rol

Las siguientes cuentas estan registradas en la base de datos para pruebas de cada perfil institucional.

| Rol               | Cedula       | Contrasena    | Modulos accesibles                                      |
|-------------------|--------------|---------------|---------------------------------------------------------|
| Empleado          | 1712345678   | empleado123   | Dashboard personal y perfil                             |
| Talento Humano    | 1234567890   | talento123    | Gestion de empleados y credenciales QR                  |
| Oficial Riesgos   | 2345678901   | riesgos123    | Consola de alertas e incidentes de seguridad            |
| Seguridad Fisica  | 3456789012   | seguridad123  | Alertas, control QR y areas criticas                    |
| Auditor Interno   | 4567890123   | auditor123    | Modulo de auditoria y bitacora de accesos               |
| Jefe de Agencia   | 5678901234   | jefe123       | Dashboard, agencias y empleados de su agencia           |
| Tecnico TI        | 6789012345   | tecnico123    | Dispositivos de escaneo y configuracion del sistema     |

### Descripcion de roles y permisos (RBAC)

- **Administrador**: acceso irrestricto a todos los modulos, configuracion global, gestion de usuarios y respaldo de datos.
- **Empleado**: visualiza unicamente las areas criticas a las que tiene permiso segun su rol institucional.
- **Talento Humano**: crea, edita y desactiva cuentas de empleados; gestiona las credenciales QR institucionales.
- **Oficial Riesgos**: revisa y actualiza el estado de las alertas de seguridad (Abierta, En Investigacion, Resuelta).
- **Seguridad Fisica**: opera el lector QR para validar accesos y gestiona alertas activas.
- **Auditor Interno**: genera informes de auditoria, revisa la bitacora completa de accesos y exporta reportes PDF/Excel.
- **Jefe de Agencia**: supervisa el dashboard de su agencia y el personal asignado a ella.
- **Tecnico TI**: administra los dispositivos de escaneo QR registrados en el sistema.

---

## Comandos de Operacion

```bash
# Ver estado de los servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio especifico
docker-compose logs -f backend
docker-compose logs -f db

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Eliminar volumenes y reconstruir desde cero
docker-compose down -v
docker-compose up --build
```

### Despliegue rapido sin rebuild completo

Para aplicar cambios al backend o al frontend sin reconstruir las imagenes Docker:

```bash
# Backend: copiar archivo modificado y recargar
docker cp backend/main.py kullkiwasi-backend-1:/app/main.py
docker-compose restart backend

# Frontend: compilar localmente y copiar al contenedor
cd frontend
npm run build
docker cp dist/. kullkiwasi-frontend-1:/usr/share/nginx/html/
docker exec kullkiwasi-frontend-1 nginx -s reload
```

---

## Solucion de Problemas

**"port is already in use"**: otro servicio ocupa el puerto 3000, 3001 o 5433. Cambia el puerto afectado en `docker-compose.yml`.

**"failed to solve: npm run build"**: actualiza Docker Desktop. El proyecto requiere Node.js 20 o superior en la imagen de build.

**"service db is not running"**: revisa los logs con `docker-compose logs db` y verifica que el archivo SQL de inicializacion en `database/` sea valido.

**El backend no refleja cambios**: el contenedor corre una imagen compilada sin hot-reload. Usa el comando de despliegue rapido descrito arriba.
