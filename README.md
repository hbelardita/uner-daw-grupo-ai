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

|    TP     | Módulo                                                          | Conceptos Clave                                                 |                          Documentación                          |                     Código Fuente                      |
| :-------: | :-------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------------------: | :----------------------------------------------------: |
|   **1**   | [tp1-intro-typescript](./tp1-intro-typescript/)                 | Tipado estático, Interfaces, Polimorfismo, Enums, Genéricos     |         [Ver README](./tp1-intro-typescript/README.md)          |     [`index.ts`](./tp1-intro-typescript/index.ts)      |
| **Final** | [tp-final-integrador/backend](./tp-final-integrador/backend/)   | Backend API REST Turnos Médicos (NestJS, PostgreSQL, TypeORM)   |  [Ver README Backend](./tp-final-integrador/backend/README.md)  |  [`backend/src/`](./tp-final-integrador/backend/src/)  |
| **Final** | [tp-final-integrador/frontend](./tp-final-integrador/frontend/) | Frontend SPA Turnos Médicos (Angular 21, PrimeNG, Tailwind CSS) | [Ver README Frontend](./tp-final-integrador/frontend/README.md) | [`frontend/src/`](./tp-final-integrador/frontend/src/) |

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
│   └── frontend/                   # Frontend SPA (Angular 21 + PrimeNG + Tailwind CSS)
│       ├── README.md               # Documentación y configuración detallada del Frontend
│       ├── angular.json            # Configuración de Angular CLI y dev server
│       ├── package.json            # Scripts y dependencias de Angular
│       ├── proxy.conf.json         # Configuración del proxy inverso hacia la API backend
│       └── src/                    # Código fuente de la SPA
├── package.json                    # Scripts globales y automatización (postinstall, db, dev)
└── README.md                       # Portada institucional e índice general
```
