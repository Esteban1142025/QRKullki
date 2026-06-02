# Sistema de Control de Accesos - Kullki Wasi

Sistema automatizado de control de accesos y trazabilidad de personal desarrollado con React + FastAPI + PostgreSQL.

## 📋 Requisitos Previos

- **Docker Desktop** instalado y ejecutándose
- **Git** instalado
- Navegador web moderno (Chrome, Firefox, Edge)

## 🚀 Guía para el Equipo

### Paso 1: Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_DIRECTORIO>
```

### Paso 2: Verificar Docker

Asegúrate de que Docker Desktop esté ejecutándose:
```bash
docker --version
docker-compose --version
```

### Paso 3: Ejecutar el Proyecto

```bash
docker-compose up --build
```

Este comando:
- Construirá las imágenes Docker de frontend, backend y base de datos
- Iniciará todos los servicios automáticamente
- Configurará PostgreSQL con las tablas necesarias

**Tiempo estimado**: 5-10 minutos en primera ejecución (depende de conexión a internet)

### Paso 4: Poblar Base de Datos

En una nueva terminal:

```bash
docker-compose exec backend python seed_db.py
```

Esto creará:
- Roles (admin, empleado)
- Agencia MAT
- Usuarios de prueba

### Paso 5: Acceder al Sistema

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Documentación API**: http://localhost:3001/docs

## 🔐 Credenciales de Prueba

### Administrador
- **DNI**: 0000000000
- **Contraseña**: kullki123

### Empleado
- **DNI**: 1111111111
- **Contraseña**: kullki123

## 📂 Estructura del Proyecto

```
Kullki wasi/
├── frontend/       → Aplicación React + Vite (interfaz de usuario)
├── backend/        → API FastAPI + SQLAlchemy (servidor Python)
├── database/       → Scripts SQL de la base de datos PostgreSQL
├── docker-compose.yml
└── README.md
```

## 🔧 Comandos Útiles

### Ver estado de los servicios
```bash
docker-compose ps
```

### Ver logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f db
```

### Detener servicios
```bash
docker-compose down
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Reconstruir desde cero
```bash
docker-compose down -v
docker-compose up --build
```

## ⚠️ Notas Importantes

### Compatibilidad con Devilbox
Si usas Devilbox en tu sistema, este proyecto está configurado para evitar conflictos de puertos:
- Frontend usa puerto 8080 (Devilbox usa 80)
- Backend usa puerto 3001
- PostgreSQL usa puerto 5433 (Devilbox usa 3306 para MySQL)

### Base de Datos
El proyecto usa **PostgreSQL** (no MySQL). La configuración está en `docker-compose.yml` y `backend/database.py`.

### Desarrollo Local
Si prefieres desarrollo local sin Docker:

**Backend**:
```bash
cd backend
pip install -r requirements.txt
python seed_db.py
uvicorn main:app --host 0.0.0.0 --port 3001
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Necesitarás PostgreSQL local en puerto 5433 o cambiar la configuración en `backend/database.py`.

## 🐛 Solución de Problemas

### Error: "port is already in use"
- Verifica que Devilbox u otro servicio no esté usando los puertos 8080, 3001 o 5433
- Detén Devilbox temporalmente o cambia los puertos en `docker-compose.yml`

### Error: "failed to solve: npm run build"
- Este proyecto usa Node.js 20 para compatibilidad con Tailwind CSS v4
- Asegúrate de tener Docker Desktop actualizado

### Error: "service db is not running"
- Verifica que el servicio de base de datos esté corriendo: `docker-compose ps`
- Revisa los logs: `docker-compose logs db`

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs con `docker-compose logs -f`
2. Verifica que Docker Desktop esté ejecutándose
3. Asegúrate de tener suficiente espacio en disco
4. Contacta al administrador del proyecto
