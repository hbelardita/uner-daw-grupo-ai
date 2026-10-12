import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Endpoint GET /api/v1/reservas - Historial de turnos de paciente (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let paciente1Token: string;
  let paciente2Token: string;
  let pacienteSinTurnosToken: string;
  let medicoToken: string;
  let adminToken: string;

  let idPaciente1: number;
  let idPaciente2: number;
  let idMedico1: number;
  let idMedico2: number;

  let insertedReservaIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);

    // 1. Obtener tokens de autenticación
    const loginPaciente1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '30111111',
        clave: 'clave_ficticia_5',
      })
      .expect(200);
    paciente1Token = loginPaciente1.body.token;

    const loginPaciente2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '30222222',
        clave: 'clave_ficticia_6',
      })
      .expect(200);
    paciente2Token = loginPaciente2.body.token;

    const loginPacienteSinTurnos = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '30333333',
        clave: 'clave_ficticia_7',
      })
      .expect(200);
    pacienteSinTurnosToken = loginPacienteSinTurnos.body.token;

    const loginMedico = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '20111111',
        clave: 'clave_ficticia_1',
      })
      .expect(200);
    medicoToken = loginMedico.body.token;

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '40111111',
        clave: 'clave_ficticia_10',
      })
      .expect(200);
    adminToken = loginAdmin.body.token;

    // 2. Obtener IDs de usuarios y médicos
    const paciente1Res = await dataSource.query(
      "SELECT id FROM usuarios WHERE documento = '30111111'",
    );
    idPaciente1 = paciente1Res[0].id;

    const paciente2Res = await dataSource.query(
      "SELECT id FROM usuarios WHERE documento = '30222222'",
    );
    idPaciente2 = paciente2Res[0].id;

    const medico1Res = await dataSource.query(
      `SELECT m.id FROM medicos m
       JOIN usuarios u ON u.id = m.id_usuario
       WHERE u.documento = '20111111'`,
    );
    idMedico1 = medico1Res[0].id;

    const medico2Res = await dataSource.query(
      `SELECT m.id FROM medicos m
       JOIN usuarios u ON u.id = m.id_usuario
       WHERE u.documento = '20222222'`,
    );
    idMedico2 = medico2Res[0].id;

    // Limpiar reservas existentes para los pacientes de prueba
    await dataSource.query(
      'DELETE FROM reservas WHERE id_paciente IN ($1, $2)',
      [idPaciente1, idPaciente2],
    );

    // 3. Sembrar reservas de prueba
    // Para Paciente 1: 4 reservas en distintos estados y fechas
    // Fecha 1: más antigua (2026-11-10 10:00:00) -> CANCELADO
    // Fecha 2: intermedia (2026-11-15 09:00:00) -> AUSENTE
    // Fecha 3: intermedia (2026-11-20 11:00:00) -> ATENDIDO
    // Fecha 4: más reciente (2026-11-25 14:00:00) -> ACTIVO
    const insertP1Res = await dataSource.query(
      `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
       VALUES
         ($1, $2, '2026-11-10 10:00:00', 'CANCELADO', 5000),
         ($3, $2, '2026-11-15 09:00:00', 'AUSENTE', 4500),
         ($1, $2, '2026-11-20 11:00:00', 'ATENDIDO', 5000),
         ($1, $2, '2026-11-25 14:00:00', 'ACTIVO', 5000)
       RETURNING id;`,
      [idMedico1, idPaciente1, idMedico2],
    );
    insertedReservaIds.push(...insertP1Res.map((r: { id: number }) => r.id));

    // Para Paciente 2: 1 reserva para comprobar aislamiento
    const insertP2Res = await dataSource.query(
      `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
       VALUES
         ($1, $2, '2026-11-18 10:00:00', 'ACTIVO', 4500)
       RETURNING id;`,
      [idMedico2, idPaciente2],
    );
    insertedReservaIds.push(...insertP2Res.map((r: { id: number }) => r.id));
  });

  afterAll(async () => {
    if (insertedReservaIds.length > 0 && dataSource) {
      await dataSource.query('DELETE FROM reservas WHERE id = ANY($1)', [
        insertedReservaIds,
      ]);
    }
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito (200 OK) y Contrato DTO Estricto', () => {
    it('debe devolver 200 OK con el listado completo y la estructura exacta del DTO para el paciente autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(4);

      // Verificar la estructura y tipos estrictos de cada elemento
      for (const item of response.body) {
        expect(item).toEqual({
          id: expect.any(Number),
          fechaHora: expect.any(String),
          estado: expect.stringMatching(
            /^(ACTIVO|ATENDIDO|AUSENTE|CANCELADO)$/,
          ),
          valorConsulta: expect.any(Number),
          medico: {
            id: expect.any(Number),
            nombres: expect.any(String),
            apellidos: expect.any(String),
            matricula: expect.any(Number),
          },
        });

        // Verificar formato ISO 8601 de fechaHora
        expect(new Date(item.fechaHora).toISOString()).toBe(item.fechaHora);

        // Verificar que no se filtren ni expongan claves planas ni paciente redundante
        expect(item).not.toHaveProperty('idMedico');
        expect(item).not.toHaveProperty('idPaciente');
        expect(item).not.toHaveProperty('paciente');
      }
    });

    it('debe ordenar las reservas en forma estrictamente cronológica descendente (fechaHora DESC)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      const turnos = response.body;
      expect(turnos).toHaveLength(4);

      // Las fechas esperadas en orden descendente:
      // 1°: 2026-11-25 14:00 (ACTIVO)
      // 2°: 2026-11-20 11:00 (ATENDIDO)
      // 3°: 2026-11-15 09:00 (AUSENTE)
      // 4°: 2026-11-10 10:00 (CANCELADO)
      expect(turnos[0].estado).toBe('ACTIVO');
      expect(turnos[1].estado).toBe('ATENDIDO');
      expect(turnos[2].estado).toBe('AUSENTE');
      expect(turnos[3].estado).toBe('CANCELADO');

      for (let i = 0; i < turnos.length - 1; i++) {
        const actual = new Date(turnos[i].fechaHora).getTime();
        const siguiente = new Date(turnos[i + 1].fechaHora).getTime();
        expect(actual).toBeGreaterThan(siguiente);
      }
    });

    it('debe incluir reservas en todos los estados posibles (ACTIVO, ATENDIDO, AUSENTE, CANCELADO)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      const estadosObtenidos = response.body.map(
        (r: { estado: string }) => r.estado,
      );
      expect(estadosObtenidos).toContain('ACTIVO');
      expect(estadosObtenidos).toContain('ATENDIDO');
      expect(estadosObtenidos).toContain('AUSENTE');
      expect(estadosObtenidos).toContain('CANCELADO');
    });

    it('debe devolver un array vacío cuando el paciente no registra ninguna reserva', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${pacienteSinTurnosToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('Aislamiento de Datos por Paciente (Seguridad y Privacidad)', () => {
    it('debe devolver únicamente las reservas del paciente autenticado sin fugar datos de otros pacientes', async () => {
      // Consulta Paciente 1: debe tener 4 turnos y ninguno de Paciente 2
      const resP1 = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      expect(resP1.body).toHaveLength(4);
      const idsP1 = resP1.body.map((r: { id: number }) => r.id);
      expect(idsP1).toEqual(
        expect.arrayContaining(insertedReservaIds.slice(0, 4)),
      );
      expect(idsP1).not.toContain(insertedReservaIds[4]);

      // Consulta Paciente 2: debe tener 1 turno y ninguno de Paciente 1
      const resP2 = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${paciente2Token}`)
        .expect(200);

      expect(resP2.body).toHaveLength(1);
      expect(resP2.body[0].id).toBe(insertedReservaIds[4]);
      expect(resP2.body[0].estado).toBe('ACTIVO');
    });

    it('no debe permitir ni procesar parámetros de consulta para filtrar u obtener datos de otro paciente', async () => {
      // Aunque un cliente envíe query params intentando consultar a idPaciente2,
      // la resolución debe extraerse exclusivamente del JWT del paciente autenticado
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reservas?idPaciente=${idPaciente2}`)
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      expect(response.body).toHaveLength(4);
      const idsObtenidos = response.body.map((r: { id: number }) => r.id);
      expect(idsObtenidos).toEqual(
        expect.arrayContaining(insertedReservaIds.slice(0, 4)),
      );
      expect(idsObtenidos).not.toContain(insertedReservaIds[4]);
    });
  });

  describe('Control de Acceso y Autorización (Ruta y Seguridad)', () => {
    it('debe responder 401 Unauthorized si la petición no incluye cabecera Authorization', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('debe responder 401 Unauthorized si el token JWT es inválido o malformado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', 'Bearer token_invalido_jwt')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('debe responder 403 Forbidden cuando el usuario autenticado tiene rol MEDICO', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('debe responder 403 Forbidden cuando el usuario autenticado tiene rol ADMINISTRADOR', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });

  describe('Regresión: PATCH /api/v1/reservas/:id/estado mantiene su autorización exclusiva de MEDICO', () => {
    it('debe rechazar con 403 Forbidden cuando un PACIENTE intenta invocar PATCH :id/estado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/reservas/${insertedReservaIds[0]}/estado`)
        .set('Authorization', `Bearer ${paciente1Token}`)
        .send({ estado: 'ATENDIDO' })
        .expect(403);

      expect(response.status).toBe(403);
    });
  });
});
