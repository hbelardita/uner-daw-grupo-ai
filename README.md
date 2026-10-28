# UNER — DAW 2026 (Grupo AI)

Repositorio de trabajos prácticos de la cátedra **Desarrollo de Aplicaciones Web** — Tecnicatura Universitaria en Desarrollo Web (Facultad de Ciencias de la Administración, UNER).

---

## 👥 Integrantes

| Integrante             |
| :--------------------- |
| **Belardita**, Horacio |
| **Beron**, Tomás       |
| **Garcia**, Hugo       |
| **Ortega**, Sergio     |
| **Sandoval**, Edgardo  |

---

## 📚 Trabajos Prácticos

|    TP     | Módulo                                                          | Conceptos Clave                                                 |                          Documentación                          |                        Código Fuente                         |
| :-------: | :-------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------------------: | :----------------------------------------------------------: |
|   **1**   | [tp1-intro-typescript](./tp1-intro-typescript/)                 | Tipado estático, Interfaces, Polimorfismo, Enums, Genéricos     |         [Ver README](./tp1-intro-typescript/README.md)          |        [`index.ts`](./tp1-intro-typescript/index.ts)         |
| **Final** | [tp-final-integrador/backend](./tp-final-integrador/backend/)   | Backend API REST Turnos Médicos (NestJS, PostgreSQL, TypeORM)   |  [Ver README Backend](./tp-final-integrador/backend/README.md)  |     [`backend/src/`](./tp-final-integrador/backend/src/)     |
| **Final** | [tp-final-integrador/frontend](./tp-final-integrador/frontend/) | Frontend SPA Turnos Médicos (Angular 21, PrimeNG, Tailwind CSS) | [Ver README Frontend](./tp-final-integrador/frontend/README.md) |    [`frontend/src/`](./tp-final-integrador/frontend/src/)    |
| **Final** | [tp-final-integrador/nginx](./tp-final-integrador/nginx/)       | Despliegue Local de Producción (Nginx Reverse Proxy, PM2)       |    [Ver README Nginx](./tp-final-integrador/nginx/README.md)    | [`nginx/nginx.conf`](./tp-final-integrador/nginx/nginx.conf) |

---

## 📁 Estructura del Repositorio

```text
.
├── tp1-intro-typescript/           # TP 1: Introducción a TypeScript
│   ├── README.md                   # Detalle de consignas del TP1
│   ├── index.ts                    # Solución del TP1 en TypeScript
│   ├── package.json                # Scripts de ejecución (dev, build, start)
│   └── tsconfig.json               # Configuración del compilador TypeScript
├── tp-final-integrador/            # TP Final Integrador: Gestión de Turnos Médicos
│   ├── backend/                    # Backend API REST (NestJS + TypeORM + PostgreSQL)
│   │   ├── README.md               # Documentación y configuración detallada del Backend
│   │   ├── docker-compose.yml      # Servicios de PostgreSQL y pgAdmin
│   │   ├── package.json            # Scripts y dependencias de NestJS
│   │   └── src/                    # Código fuente de la API
│   ├── frontend/                   # Frontend SPA (Angular 21 + PrimeNG + Tailwind CSS)
│   │   ├── README.md               # Documentación y configuración detallada del Frontend
│   │   ├── angular.json            # Configuración de Angular CLI y dev server
│   │   ├── package.json            # Scripts y dependencias de Angular
│   │   ├── proxy.conf.json         # Configuración del proxy inverso hacia la API backend
│   │   └── src/                    # Código fuente de la SPA
│   └── nginx/                      # Despliegue local aislado con Nginx y PM2
│       ├── README.md               # Runbook, troubleshooting y arquitectura de producción
│       ├── nginx.conf              # Servidor web estático SPA y Reverse Proxy a NestJS
│       └── mime.types              # Mapeo de tipos MIME autocontenido
├── package.json                    # Scripts globales y automatización (postinstall, db, dev)
└── README.md                       # Portada institucional e índice general
```

---

## 🚀 Despliegue Local de Producción (Nginx + PM2)

Para poner en marcha el stack completo en modo producción unificado bajo el puerto `80`:

```bash
# 1. Base de datos PostgreSQL
npm run db:up

# 2. Compilar frontend (Angular)
npm run build:frontend

# 3. Compilar y levantar backend con PM2
npm run deploy:backend

# 4. Iniciar Nginx aislado (requiere sudo para puerto 80)
npm run nginx:start
```

- **Acceso:** Abrir en el navegador [`http://localhost`](http://localhost).
- **Detener:** `npm run nginx:stop` y `npm run deploy:stop:backend`.
- **Documentación completa:** Ver [tp-final-integrador/nginx/README.md](./tp-final-integrador/nginx/README.md).
