# Sistema de Inventario de Insumos Médicos — IMSS Traumatología

Sistema web completo para la gestión de inventario de insumos médicos del área de traumatología del IMSS.

---

## Roles de usuario

| Rol      | Acceso                                                                 |
| -------- | ---------------------------------------------------------------------- |
| `admin`  | Todo: entradas, salidas, registro, eliminación, inventario y alertas   |
| `user`   | Entradas, salidas, inventario y alertas                                |
| `viewer` | Solo inventario y configuración de alertas (sin modificar existencias) |

---

## Requisitos Previos

- **Node.js** v18 o superior
- npm v9 o superior
- _(No se necesita instalar ningún servidor de base de datos — usa SQLite)_

---

## Instalación y Ejecución Local

### 1. Configurar variables de entorno del backend

Copia el archivo de ejemplo y edítalo:

```bash
cd backend
cp .env.example .env
```

Contenido mínimo del `.env`:

```
PORT=4000
DB_PATH=./data/imss.db
JWT_SECRET=cambia_este_secreto_jwt
JWT_REFRESH_SECRET=cambia_este_secreto_refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### 2. Inicializar la base de datos (solo la primera vez)

```bash
cd backend
npm install
npm run seed
```

Esto crea `backend/data/imss.db` con todas las tablas y los siguientes usuarios de prueba:

| Rol      | Email              | Contraseña |
| -------- | ------------------ | ---------- |
| `admin`  | admin@imss.com     | Admin123   |
| `user`   | usuario@imss.com   | Usuario123 |
| `viewer` | visor@imss.com     | Visor123   |

### 3. Iniciar el backend

```bash
cd backend
npm run dev
```

Disponible en: `http://localhost:4000`

### 4. Iniciar el frontend (nueva terminal)

```bash
cd frontend
npm install
npm run dev
```

Disponible en: `http://localhost:5173`

---

## Estructura del Proyecto

```
proyecto/
├── .env                          # Variables para docker-compose (no subir a git)
├── .gitignore
├── docker-compose.yml
│
├── backend/
│   ├── .env                      # Variables de entorno locales (no subir a git)
│   ├── .env.example              # Plantilla de variables de entorno
│   ├── Dockerfile
│   ├── data/imss.db              # Base de datos SQLite (se crea con npm run seed)
│   └── src/
│       ├── config/db.js          # Conexión a SQLite (better-sqlite3)
│       ├── db/schema.sql         # Esquema de la base de datos
│       ├── db/seed.js            # Script de datos iniciales
│       ├── middleware/           # Auth JWT y control de roles
│       ├── routes/               # Rutas de la API
│       ├── controllers/          # Lógica de negocio
│       ├── services/             # Servicio de alertas (cron)
│       ├── socket/               # Socket.io
│       ├── app.js                # Express app
│       └── server.js             # Punto de entrada
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                # Proxy reverso (Railway/Docker)
    ├── index.html
    └── src/
        ├── pages/                # Pantallas de la app
        ├── components/           # Componentes reutilizables
        ├── store/                # Estado global (Zustand)
        ├── api/                  # Llamadas a la API
        ├── lib/                  # Axios, Socket.io, utilidades
        └── types/                # Tipos TypeScript
```

---

## Pantallas

| Ruta        | Roles              | Descripción                                  |
| ----------- | ------------------ | -------------------------------------------- |
| /login      | público            | Inicio de sesión                             |
| /menu       | todos              | Menú principal (cards según rol)             |
| /entradas   | admin, user        | Registrar entrada de insumos                 |
| /salidas    | admin, user        | Registrar salida de insumos                  |
| /inventario | todos              | Inventario en tiempo real + historial        |
| /alertas    | todos              | Configurar alertas de existencia y caducidad |

---

## API Endpoints

| Método | Ruta                    | Rol requerido | Descripción                   |
| ------ | ----------------------- | ------------- | ----------------------------- |
| POST   | /api/auth/login         | —             | Iniciar sesión                |
| POST   | /api/auth/refresh       | —             | Renovar token                 |
| POST   | /api/auth/logout        | —             | Cerrar sesión                 |
| POST   | /api/auth/forgot-password | —           | Solicitar reset de contraseña |
| POST   | /api/auth/reset-password  | —           | Restablecer contraseña        |
| GET    | /api/insumos            | todos         | Listar insumos                |
| POST   | /api/insumos            | admin         | Crear insumo                  |
| PUT    | /api/insumos/:id        | admin         | Actualizar insumo             |
| DELETE | /api/insumos/:id        | admin         | Eliminar insumo               |
| GET    | /api/movimientos        | todos         | Historial de movimientos      |
| POST   | /api/movimientos        | admin, user   | Registrar entrada/salida      |
| GET    | /api/alertas            | todos         | Ver configuración de alertas  |
| POST   | /api/alertas/bulk       | todos         | Guardar alertas en lote       |

---

## Despliegue en Railway

El proyecto incluye Dockerfiles listos para Railway. Se despliegan dos servicios separados: **backend** y **frontend**.

### Paso 1 — Subir el código a GitHub

Asegúrate de que `.gitignore` esté correctamente configurado (ya lo está). Los archivos `.env` y `backend/data/*.db` **no se suben**.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Paso 2 — Crear el servicio de Backend en Railway

1. En Railway, crea un nuevo proyecto → **Deploy from GitHub repo**
2. Selecciona la carpeta raíz como `/backend` (o configura el Root Directory en Settings)
3. Railway detectará el `Dockerfile` automáticamente
4. Agrega un **Volume** en Railway para persistir la base de datos:
   - Mount path: `/app/data`
5. En **Variables**, agrega:

```
PORT=4000
DB_PATH=/app/data/imss.db
JWT_SECRET=un_secreto_seguro_largo
JWT_REFRESH_SECRET=otro_secreto_seguro_largo
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=https://tu-frontend.up.railway.app
```

6. Una vez desplegado, Railway te dará la URL del backend, por ejemplo:
   `https://imss-backend.up.railway.app`

7. Ejecuta el seed para crear las tablas y usuarios iniciales desde la consola de Railway:
```bash
node src/db/seed.js
```

### Paso 3 — Crear el servicio de Frontend en Railway

1. Crea otro servicio en el mismo proyecto → **Deploy from GitHub repo**
2. Configura el Root Directory como `/frontend`
3. Railway detectará el `Dockerfile` automáticamente
4. En **Variables**, agrega:

```
BACKEND_URL=https://imss-backend.up.railway.app
```

5. Una vez desplegado, actualiza la variable `CLIENT_ORIGIN` del backend con la URL del frontend.

---

## Docker Compose (desarrollo local con contenedores)

```bash
# Copia y configura las variables
cp .env.example .env   # edita JWT_SECRET y JWT_REFRESH_SECRET

# Levanta ambos servicios
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend: `http://localhost:4000`

---

## Tecnologías

**Backend:** Node.js, Express, SQLite (better-sqlite3), JWT, Socket.io, node-cron, bcryptjs, nodemailer

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Zustand, React Query, React Router v7, React Hook Form, Zod, Socket.io client
