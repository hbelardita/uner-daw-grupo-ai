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

|    TP     | Módulo                                          | Conceptos Clave                                                    |                         Documentación                         |                    Código Fuente                     |
| :-------: | :---------------------------------------------- | :----------------------------------------------------------------- | :-----------------------------------------------------------: | :--------------------------------------------------: |
|   **1**   | [tp1-intro-typescript](./tp1-intro-typescript/) | Tipado estático, Interfaces, Polimorfismo, Enums, Genéricos        |        [Ver README](./tp1-intro-typescript/README.md)         |    [`index.ts`](./tp1-intro-typescript/index.ts)     |
| **Final** | [tp-final-integrador](./tp-final-integrador/)   | Sistema de Gestión de Turnos Médicos (NestJS, PostgreSQL, TypeORM) | [Ver README Backend](./tp-final-integrador/backend/README.md) | [`backend/src/`](./tp-final-integrador/backend/src/) |

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
│   └── backend/                    # Backend API REST (NestJS + TypeORM + PostgreSQL)
│       ├── README.md               # Documentación y configuración detallada del Backend
│       ├── docker-compose.yml      # Servicios de PostgreSQL y pgAdmin
│       ├── package.json            # Scripts y dependencias de NestJS
│       └── src/                    # Código fuente de la API
├── package.json                    # Scripts globales y automatización (postinstall, db, dev)
└── README.md                       # Portada institucional e índice general
```
