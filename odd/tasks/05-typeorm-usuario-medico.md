# Feature: 05 - Entidades TypeORM: Usuario y Medico

## Objective

Implementar el mapeo objeto-relacional (ORM) con TypeORM para las entidades `Usuario` y `Medico`, reflejando la relación 1 a (0..1), tipos enteros para identificadores, matrícula y valor de consulta, campos de texto `varchar`, tipos `enum` nativos (`estados_usuarios`, `roles_usuarios`) y exclusión predeterminada del campo sensible `clave` (`{ select: false }`).

## Problem & Context

El sistema de turnos médicos requiere modelar y persistir usuarios con diferentes roles (`ADMINISTRADOR`, `PACIENTE`, `MEDICO`) y médicos asociados a usuarios. La base de datos PostgreSQL ya contiene las tablas `usuarios` y `medicos` y los tipos ENUM. Es necesario mapear estas tablas como entidades TypeORM en NestJS preservando la integridad referencial, tipos estrictos y seguridad de credenciales.

## Scope & Constraints

- Entidad `Usuario` mapeada a la tabla `usuarios` con PK `id: number` (`int`), campos `documento`, `apellidos`, `nombres`, `email`, `clave` (`varchar`, `{ select: false }`), `estado` (`EstadoUsuario`), `rol` (`RolUsuario`).
- Enums TypeScript `EstadoUsuario` ('ACTIVO', 'BAJA') y `RolUsuario` ('MEDICO', 'PACIENTE', 'ADMINISTRADOR') enlazados a los tipos nativos de Postgres (`estados_usuarios`, `roles_usuarios`).
- Entidad `Medico` mapeada a la tabla `medicos` con PK `id: number` (`int`), FK `idUsuario: number` (`id_usuario`, `int`), `matricula: number` (`int`), `valorConsulta: number` (`valor_consulta`, `int`).
- Relación `@OneToOne` entre `Medico` y `Usuario` sobre `id_usuario`.
- Módulos NestJS organizados modularmente (`UsuariosModule`, `MedicosModule`) exportando TypeORM feature repositories.
- Pruebas de integración E2E validando inserción, consulta, exclusión de `clave` y relación `Usuario` <-> `Medico`.

## Configuration

- **TDD Mode**: off (default / no explicit config)
- **Test Runners**:
  - Unit: `npm run test:backend` (`vitest run`)
  - E2E: `npm run test:backend:e2e` (`vitest run --config ./vitest.config.e2e.ts`)
  - Lint: `npm run lint:backend` (`oxlint src/ test/`)
- **Delivery Strategy**: `ask-on-risk` (forecast: ~250 authored changed lines)

## Tasks

- [ ] `TASK-05-01`: Definir enums `EstadoUsuario` y `RolUsuario` con paridad a PostgreSQL.
  - Checks: Oxlint, TypeScript compilation
  - Outcome: N/A
  - Commit: N/A
- [ ] `TASK-05-02`: Crear entidad `Usuario` con columnas varchar, tipos enum nativos y `{ select: false }` en `clave`.
  - Checks: Oxlint, TypeScript compilation
  - Outcome: N/A
  - Commit: N/A
- [ ] `TASK-05-03`: Crear entidad `Medico` con columnas matricula/valor_consulta int y relación `@OneToOne` con `Usuario`.
  - Checks: Oxlint, TypeScript compilation
  - Outcome: N/A
  - Commit: N/A
- [ ] `TASK-05-04`: Crear `UsuariosModule` y `MedicosModule`, integrarlos en `AppModule` y verificar suite de pruebas e2e y linters.
  - Checks: `npm run lint:backend`, `npm run test:backend`, `npm run test:backend:e2e`
  - Outcome: N/A
  - Commit: N/A
