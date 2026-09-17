<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

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

## 💻 Comandos de Ejecución y Desarrollo

```bash
# Desarrollo con recarga automática (watch mode)
npm run start:dev

# Compilar para producción
npm run build

# Iniciar build de producción
npm run start:prod
```
