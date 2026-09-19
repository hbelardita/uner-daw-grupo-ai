<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Descripción

API REST para el **Sistema de Gestión de Turnos Médicos**, desarrollada con [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) y [PostgreSQL](https://www.postgresql.org/).
Cátedra **Desarrollo de Aplicaciones Web (DAW 2026)** — UNER.

---

## 🚀 Puesta en Marcha Inicial

### Opción A: Desde la raíz del repositorio (Recomendado)

El repositorio cuenta con scripts automatizados en el `package.json` principal:

1. **Instalar dependencias y generar `.env`:**

   ```bash
   npm install
   ```

   > ℹ️ **Automatización:** Al ejecutar `npm install` en la raíz, el hook `postinstall` ejecuta `npm run setup:env`, el cual copia automáticamente `.env.example` a `.env` (si aún no existe, sin sobreescribir tus cambios) e instala todas las dependencias del backend.

2. **Levantar la base de datos con Docker (Opcional):**

   ```bash
   npm run db:up
   ```

3. **Iniciar el backend en modo desarrollo:**
   ```bash
   npm run dev:backend
   ```

---

### Opción B: Directo desde el directorio `backend`

Si trabajás situado dentro de `tp-final-integrador/backend`:

1. **Configurar las variables de entorno:**
   Copiá el archivo de plantilla a `.env`:
   - **Linux / macOS:**
     ```bash
     cp .env.example .env
     ```
   - **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env
     ```
   - **Windows (CMD):**
     ```cmd
     copy .env.example .env
     ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Levantar la base de datos:**

   ```bash
   npm run db:up
   ```

4. **Iniciar en modo desarrollo (hot-reload):**
   ```bash
   npm run start:dev
   ```

---

## ⚙️ Variables de Entorno (`.env`)

| Variable             | Valor por Defecto       | Descripción                                                |
| :------------------- | :---------------------- | :--------------------------------------------------------- |
| `NODE_ENV`           | `development`           | Entorno de ejecución (`development`, `production`, `test`) |
| `PORT`               | `3000`                  | Puerto HTTP donde corre la API                             |
| `POSTGRES_HOST`      | `localhost`             | Host de la base de datos                                   |
| `POSTGRES_PORT`      | `5432`                  | Puerto expuesto de PostgreSQL                              |
| `POSTGRES_USER`      | `postgres`              | Usuario de PostgreSQL                                      |
| `POSTGRES_PASSWORD`  | `postgres`              | Contraseña de PostgreSQL                                   |
| `POSTGRES_DB`        | `tp-integrador`         | Nombre de la base de datos principal                       |
| `POSTGRES_DB_TEST`   | `tp-integrador-test`    | Nombre de la base de datos de tests                        |
| `DB_LOGGING`         | `false`                 | Habilita logs de consultas SQL de TypeORM                  |
| `CORS_ORIGIN`        | `http://localhost:4200` | Origen permitido para solicitudes CORS (Frontend)          |
| `SWAGGER_HABILITADO` | `true`                  | Habilita la documentación OpenAPI/Swagger en `/api/docs`   |
| `PGADMIN_PORT`       | `5050`                  | Puerto del panel web pgAdmin                               |
| `PGADMIN_EMAIL`      | `admin@admin.com`       | Email de inicio de sesión de pgAdmin                       |
| `PGADMIN_PASSWORD`   | `admin`                 | Clave de inicio de sesión de pgAdmin                       |

---

## 🌐 Enlaces y Servicios Locales

Una vez levantados los servicios, podés acceder a:

- **API Base:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Documentación Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Especificación OpenAPI (JSON):** [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)
- **pgAdmin 4:** [http://localhost:5050](http://localhost:5050)

---

## 🐘 Base de Datos (PostgreSQL + pgAdmin)

Los siguientes scripts pueden ejecutarse tanto desde la raíz como dentro de `tp-final-integrador/backend`:

```bash
npm run db:up      # Inicia PostgreSQL + pgAdmin en segundo plano
npm run db:status  # Verifica el estado y healthcheck de los contenedores
npm run db:logs    # Muestra los logs en tiempo real de PostgreSQL
npm run db:down    # Detiene los contenedores sin borrar datos
npm run db:reset   # Detiene, elimina volúmenes (datos) y vuelve a crear la base
```

### Conexión en pgAdmin (Cliente Web)

1. Ingresá a [http://localhost:5050](http://localhost:5050).
2. Iniciá sesión con las credenciales de `PGADMIN_EMAIL` y `PGADMIN_PASSWORD` (`admin@admin.com` / `admin`).
3. Creá una nueva conexión de servidor (**Add New Server**):
   - **General → Name:** `PostgreSQL Local`
   - **Connection → Host name/address:** `postgres` (nombre del contenedor dentro de la red Docker).
   - **Connection → Port:** `5432`
   - **Connection → Maintenance database:** `tp-integrador`
   - **Connection → Username:** `postgres`
   - **Connection → Password:** `postgres`

> 💡 **Nota:** Si te conectás desde tu máquina host mediante DBeaver, DataGrip o `psql`, usá `localhost` como host. Dentro de pgAdmin usá `postgres` porque ambos contenedores comparten la red de Docker.

---

### Alternativa: Configuración Manual con pgAdmin (Sin Docker)

Si disponés de una instalación local de PostgreSQL y pgAdmin en tu máquina:

#### 1. Conexión al servidor local

1. Abrí pgAdmin y conectate a tu servidor local de PostgreSQL en el panel izquierdo (**Object Explorer**). Por defecto suele estar en `localhost:5432` con usuario `postgres`.

#### 2. Creación de la base de datos

1. En el árbol de navegación, hacé clic derecho en **Databases** → **Create** → **Database...**.
2. En la pestaña **General**, ingresá el nombre de la base de datos: `tp-integrador` (o el configurado en tu `.env` como `POSTGRES_DB`).
3. Hacé clic en **Save**.
4. _(Opcional para tests)_: Repetí el proceso creando la base `tp-integrador-test` si tenés previsto correr los tests end-to-end (`npm run test:e2e`).

#### 3. Importación y ejecución de scripts (`init/`)

Los scripts deben ejecutarse en la base de datos `tp-integrador` en orden secuencial:

1. Desplegá el nodo **Databases** y seleccioná `tp-integrador`.
2. Hacé clic derecho sobre `tp-integrador` y seleccioná **Query Tool** (o menú superior: _Tools_ → _Query Tool_).
3. **Estructura y esquemas (`01-init.sql`):**
   - En la barra de herramientas del Query Tool, hacé clic en el ícono de carpeta (**Open File** o `Ctrl + O`).
   - Navegá hasta [`init/01-init.sql`](./init/01-init.sql) y abrilo (o copiá y pegá su contenido en el editor).
   - Presioná el botón de ejecución (**Execute / Refresh** o `F5`).
   - Verificá en la pestaña _Messages_ que la consulta haya finalizado exitosamente (`Query returned successfully`). Esto creará los tipos `ENUM`, las tablas (`usuarios`, `medicos`, `reservas`) e índices.
4. **Carga de datos iniciales (`02-seed.sql`):**
   - Hacé clic nuevamente en **Open File**, seleccioná [`init/02-seed.sql`](./init/02-seed.sql) y presiona **Execute** (`F5`).
   - Esto insertará los usuarios base (médicos, pacientes, administrador con contraseñas encriptadas en bcrypt), registros de médicos y turnos de ejemplo.

> 💡 **Nota para la base de tests:** Si creaste `tp-integrador-test`, abrí un **Query Tool** sobre ella y ejecutá también `01-init.sql` y `02-seed.sql` para dejarla lista para las pruebas automatizadas.

#### 4. Ajuste de variables de entorno (`.env`)

Verificá que el archivo `.env` en `tp-final-integrador/backend/.env` apunte a tu instalación local:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña_local
POSTGRES_DB=tp-integrador
POSTGRES_DB_TEST=tp-integrador-test
```

---

## 💻 Comandos de Ejecución y Desarrollo

```bash
# Desarrollo con recarga automática (watch mode)
npm run start:dev

# Compilar para producción
npm run build

# Iniciar build de producción
npm run start:prod
```
