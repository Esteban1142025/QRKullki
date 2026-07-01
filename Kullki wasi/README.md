# Sistema de Control de Accesos — Kullki Wasi

Sistema automatizado de control de accesos físicos y trazabilidad de personal para la Cooperativa de Ahorro y Crédito Kullki Wasi Ltda., desarrollado bajo normativa SEPS Segmento 1.

**Stack tecnológico:** React + Vite (frontend), FastAPI + SQLAlchemy (backend), PostgreSQL (base de datos), Docker Compose (orquestación).

---

## Estructura del Proyecto

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
│   └── requirements.txt    Dependencias Python
├── database/                Esquema SQL de PostgreSQL
│   └── kullkidb_postgres.sql  Esquema + datos iniciales, contraseñas ya hasheadas con bcrypt
├── docker-compose.yml      Orquestación de los 3 servicios (frontend, backend, db)
└── README.md
```

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta       | Versión mínima | Verificación                     | Descarga                                       |
|-------------------|---------------|----------------------------------|-------------------------------------------------|
| Docker Desktop    | 4.0+          | `docker --version`               | https://www.docker.com/products/docker-desktop  |
| Docker Compose    | 2.0+          | `docker compose version`         | Incluido en Docker Desktop                      |
| Git               | 2.0+          | `git --version`                  | https://git-scm.com/downloads                   |

> **IMPORTANTE (Windows):** Docker Desktop debe estar **abierto y en ejecución** antes de ejecutar cualquier comando Docker. Verifica que el ícono de Docker aparezca en la barra de tareas y diga "Docker Desktop is running".

---

## Instalación y Ejecución con Docker (Recomendado)

El proyecto está preparado para levantarse con **un solo comando**. No se necesita ningún paso manual de configuración de base de datos: las 6 agencias, los 13 usuarios, las áreas críticas y los lectores QR se cargan automáticamente la primera vez que arranca el contenedor de PostgreSQL.

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Esteban1142025/QRKullki.git
cd QRKullki
cd "Kullki wasi"
```

### Paso 2 — Levantar todos los servicios

```bash
docker compose up
```

> **Primera ejecución:** Docker descargará las imágenes base (Node.js, Python, PostgreSQL), compilará los contenedores y cargará automáticamente el esquema con todos los datos iniciales. Tiempo estimado: **5-10 minutos** según la velocidad de internet.

Docker Compose espera automáticamente a que PostgreSQL esté **completamente listo** (healthcheck) antes de arrancar el backend, así que no hay condiciones de carrera ni pasos manuales adicionales. Espera hasta ver en la terminal mensajes similares a:

```
kullki-wasi-db     | database system is ready to accept connections
kullkiwasi-backend-1  | Tablas de Base de Datos inicializadas.
kullkiwasi-backend-1  | Uvicorn running on http://0.0.0.0:3001
kullkiwasi-frontend-1 | VITE v5.x.x ready in xxx ms
kullkiwasi-frontend-1 | ➜ Local:   http://localhost:5173/
```

### Paso 3 — Acceder al sistema

Abre tu navegador y visita:

| Servicio              | URL                                 |
|-----------------------|-------------------------------------|
| **Frontend**       | **http://localhost:5173**           |
| **Backend API**    | http://localhost:3001               |
| **Docs API (Swagger)** | http://localhost:3001/docs      |

> **NOTA:** NO uses `http://localhost:3000`. El frontend funcional es el que se sirve en el puerto **5173** (servidor de desarrollo Vite). El puerto 3000 ya no se utiliza.

### Paso 4 — Iniciar sesión

Usa las siguientes credenciales de administrador global para la primera prueba (ver la tabla completa de usuarios más abajo):

- **Cédula:** `0987654321`
- **Contraseña:** `admin123`

---

## Detener y Reiniciar los Servicios

```bash
# Detener todos los servicios (mantiene los datos de la BD)
docker compose down

# Volver a iniciar (sin reconstruir)
docker compose up

# Reconstruir e iniciar (necesario si cambiaste código del backend o dependencias)
docker compose up --build

# Eliminar TODO (incluidos datos de la BD) y reconstruir desde cero
docker compose down -v
docker compose up --build
# Al arrancar de nuevo, la base de datos se vuelve a poblar automáticamente
# con las 6 agencias, los 13 usuarios y todos los datos iniciales.
```

> **Importante sobre el backend:** el Dockerfile del backend copia el código dentro de la imagen (`COPY . .`), no usa volumen montado. Si modificas archivos en `backend/` (por ejemplo `main.py`), los cambios **no se reflejarán** en el contenedor con un simple `docker compose restart backend` — necesitas reconstruir la imagen con `docker compose up --build backend`. El frontend sí tiene hot-reload automático porque usa volúmenes montados.

---

## Ejecución en Desarrollo Local (sin Docker)

> **Esta sección es completamente opcional e independiente de Docker.** Si ya usaste `docker compose up` en la sección anterior, **no necesitas hacer nada de lo que sigue** — el sistema ya está funcionando. Esta ruta alternativa es solo para quienes prefieran instalar Node.js, Python y PostgreSQL directamente en su máquina en lugar de usar contenedores (por ejemplo, para depurar con mayor control o por preferencia personal).

Si prefieres ejecutar los servicios directamente en tu máquina, sin Docker:

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

# Cargar el esquema y datos iniciales (contraseñas ya vienen hasheadas con bcrypt)
psql -U kullki_user -d kullki_wasi_db -f database/kullkidb_postgres.sql
```

> **Nota:** Si PostgreSQL usa un puerto diferente al 5432, ajusta la variable `DATABASE_URL` en `backend/database.py`. No es necesario ejecutar ningún script de seed adicional: las contraseñas del archivo SQL ya están hasheadas y listas para autenticar.

### 2. Iniciar el backend

```bash
cd backend
pip install -r requirements.txt
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

## Puertos del Sistema

| Servicio    | Puerto (Docker) | Puerto (Local)  | Descripción                        |
|-------------|-----------------|------------------|-------------------------------------|
| Frontend    | 5173            | 5173             | Servidor de desarrollo Vite        |
| Backend     | 3001            | 3001             | API REST FastAPI (uvicorn)         |
| PostgreSQL  | 5433            | 5432             | Base de datos PostgreSQL           |

> En Docker, PostgreSQL se expone en el puerto **5433** del host para evitar conflictos con una instancia local de PostgreSQL que podría estar usando el puerto 5432.

---

## Credenciales de Usuarios del Sistema

Al arrancar el proyecto por primera vez se cargan **6 agencias** y **13 usuarios** con roles y contraseñas ya definidos. No hace falta crear nada manualmente para empezar a probar el sistema.

### Agencia Matriz Ambato (MAT) — 8 roles completos

| Rol               | Cédula       | Contraseña    | Módulos accesibles                                    |
|-------------------|-------------|---------------|---------------------------------------------------------|
| Administrador     | 0987654321  | admin123      | Acceso irrestricto a todo el sistema y todas las agencias |
| Empleado          | 1712345678  | empleado123   | Dashboard personal y perfil                              |
| Talento Humano    | 1234567890  | talento123    | Gestión de colaboradores y credenciales QR               |
| Oficial Riesgos   | 2345678901  | riesgos123    | Consola de alertas e incidentes de seguridad             |
| Seguridad Física  | 3456789012  | seguridad123  | Alertas, Control QR y Áreas Críticas                     |
| Auditor Interno   | 4567890123  | auditor123    | Módulo de auditoría y bitácora de accesos                |
| Jefe de Agencia   | 5678901234  | jefe123       | Colaboradores, dashboard y agencia (solo MAT)            |
| Técnico TI        | 6789012345  | tecnico123    | Dispositivos de escaneo y configuración del sistema      |

### Jefes de Agencia por Sucursal

Cada sucursal tiene un único responsable con rol **Jefe de Agencia**, que solo puede gestionar colaboradores dentro de su propia agencia (no puede crear otras agencias ni asignar el rol Administrador).

| Agencia             | Código | Cédula      | Contraseña      | Correo                             |
|---------------------|--------|-------------|-----------------|-------------------------------------|
| Agencia Pelileo     | PEL    | 1800000001  | jefe.pel2026    | marco.cepeda@kullkiwasi.fin.ec      |
| Agencia Píllaro     | PIL    | 1800000002  | jefe.pil2026    | diana.flores@kullkiwasi.fin.ec      |
| Agencia Baños       | BAN    | 1800000003  | jefe.ban2026    | rodrigo.mora@kullkiwasi.fin.ec      |
| Agencia Salcedo     | SAL    | 1800000004  | jefe.sal2026    | elena.chavez@kullkiwasi.fin.ec      |
| Agencia Quisapincha | QUI    | 1800000005  | jefe.qui2026    | fernando.tello@kullkiwasi.fin.ec    |

### Descripción de roles y permisos (RBAC)

- **Administrador**: único rol con acceso irrestricto a todos los módulos, todas las agencias, configuración global, gestión de usuarios y respaldo de datos. Solo debe existir un administrador global en el sistema.
- **Jefe de Agencia**: gestiona los colaboradores de **su propia agencia únicamente** (creación, edición, baja). No puede ver ni modificar empleados de otras agencias, no puede crear nuevas agencias y no puede asignar el rol de Administrador a nadie.
- **Talento Humano**: crea, edita y desactiva cuentas de colaboradores; gestiona las credenciales QR institucionales (alcance global, agencia Matriz).
- **Empleado**: visualiza únicamente las áreas críticas a las que tiene permiso según su rol institucional.
- **Oficial Riesgos**: revisa y actualiza el estado de las alertas de seguridad (Abierta, En Investigación, Resuelta).
- **Seguridad Física**: opera el lector QR para validar accesos y gestiona alertas activas.
- **Auditor Interno**: genera informes de auditoría, revisa la bitácora completa de accesos y exporta reportes.
- **Técnico TI**: administra los dispositivos de escaneo QR registrados en el sistema.

### Creación de nuevas agencias

Solo el **Administrador global** puede crear una agencia nueva desde el módulo **Agencias**. Al hacerlo, el formulario exige designar de forma **obligatoria** al Jefe de esa agencia (nombres, apellidos, cédula y contraseña) en el mismo paso — no es posible crear una agencia sin asignarle un responsable. Esa persona quedará automáticamente con el rol Jefe de Agencia, limitado a gestionar únicamente el personal de su propia sucursal.

---

## Datos Precargados del Sistema

Además de los usuarios, el arranque inicial incluye:

| Recurso                | Cantidad | Detalle                                                        |
|-------------------------|----------|-----------------------------------------------------------------|
| Agencias                | 6        | Matriz Ambato + 5 sucursales (Pelileo, Píllaro, Baños, Salcedo, Quisapincha) |
| Colaboradores            | 13       | 8 en Matriz Ambato + 1 jefe por cada sucursal                  |
| Áreas Críticas           | 12       | 7 en Matriz Ambato (Bóveda, Servidores, Cajas, etc.) + 1 acceso principal por sucursal |
| Dispositivos / Lectores QR | 12    | Un lector asignado a cada área crítica                          |
| Departamentos            | 9        | Se crean automáticamente al iniciar el backend                 |
| Roles                    | 8        | admin, empleado, talento_humano, riesgos, seguridad_fisica, auditor, jefe_agencia, tecnico_ti |

---

## Comandos Útiles de Docker

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs en tiempo real (todos los servicios)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Reiniciar un servicio individual (solo refleja cambios en frontend, no en backend)
docker compose restart frontend

# Reconstruir e iniciar el backend tras modificar su código
docker compose up --build backend

# Acceder a la consola de PostgreSQL
docker compose exec db psql -U kullki_user -d kullki_wasi_db
```

---

## Solución de Problemas

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

Las contraseñas ya vienen hasheadas con bcrypt dentro de `database/kullkidb_postgres.sql`, así que un `docker compose up` normal debería dejar todos los logins funcionando de inmediato. Si aun así falla:

```bash
# Verificar que la base de datos realmente cargó los datos iniciales
docker compose exec db psql -U kullki_user -d kullki_wasi_db -c "SELECT identificacion, nombres FROM empleados;"

# Si la tabla está vacía o incompleta, reconstruir desde cero
docker compose down -v
docker compose up --build
```

> `docker compose down -v` borra el volumen de PostgreSQL, así que el archivo `kullkidb_postgres.sql` se vuelve a ejecutar automáticamente en el siguiente `up` (solo se ejecuta en un volumen vacío).

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

### Modifiqué `backend/main.py` y no veo los cambios

El backend **no** tiene hot-reload ni volumen montado — el código se copia dentro de la imagen al momento del build. Después de cualquier cambio en `backend/`, reconstruye la imagen:

```bash
docker compose up --build backend
```

Un simple `docker compose restart backend` **no** es suficiente, porque reinicia el mismo contenedor con el código antiguo ya copiado.

### Los cambios en el frontend no se reflejan

El servidor de desarrollo Vite tiene **hot-reload automático** gracias a los volúmenes montados. Si aun así no aparecen:

```bash
# Reiniciar el frontend
docker compose restart frontend

# Si cambiaste dependencias (package.json), reconstruir
docker compose up --build frontend
```

### "Docker daemon is not running" (Windows)

Abre Docker Desktop desde el menú inicio y espera a que se inicialice completamente antes de ejecutar comandos Docker.

---

## Resumen Rápido (Copiar y Pegar)

Para levantar el proyecto completo desde cero en **3 comandos**:

```bash
git clone https://github.com/Esteban1142025/QRKullki.git
cd QRKullki/"Kullki wasi"
docker compose up
```

Luego abre **http://localhost:5173** e inicia sesión con cédula `0987654321` y contraseña `admin123`.
