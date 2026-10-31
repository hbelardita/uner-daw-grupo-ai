import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
  fechaCalendarioClinicaConDesplazamiento,
  fechaHoraUtcNaive,
} from './setup/fechas.js';

describe('Endpoint POST /api/v1/reservas/:id/cancelacion - Cancelación de reserva (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let paciente1Token: string;
  let paciente2Token: string;
  let medicoToken: string;
  let adminToken: string;

  let idPaciente1: number;
  let idPaciente2: number;
  let idMedico1: number;

  let idReservaFuturaP1: number;
  let idReservaHoyP1: number;
  let idReservaCanceladaP1: number;
  let idReservaFuturaP2: number;
  let idReservaPasadaP1: number;
  let fechaFuturaP2Iso: string;

  const insertedReservaIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);

    const loginPaciente1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento: '30111111', clave: 'clave_ficticia_5' })
      .expect(200);
    paciente1Token = loginPaciente1.body.token;

    const loginPaciente2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento: '30222222', clave: 'clave_ficticia_6' })
      .expect(200);
    paciente2Token = loginPaciente2.body.token;

    const loginMedico = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento: '20111111', clave: 'clave_ficticia_1' })
      .expect(200);
    medicoToken = loginMedico.body.token;

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento: '40111111', clave: 'clave_ficticia_10' })
      .expect(200);
    adminToken = loginAdmin.body.token;

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

    // Calcular fechas dinámicas para pruebas e2e relativas a "hoy".
    // Los turnos se expresan con la hora de Argentina de la clínica y se
    // persisten en UTC (por ejemplo 10:00 AR = 13:00 UTC).
    const fechaHoyIso = fechaHoraUtcNaive(
      fechaCalendarioClinicaConDesplazamiento(0),
      12,
    );

    const fechaFuturaIso = fechaHoraUtcNaive(
      fechaCalendarioClinicaConDesplazamiento(5),
      10,
    );

    fechaFuturaP2Iso = fechaHoraUtcNaive(
      fechaCalendarioClinicaConDesplazamiento(5),
      14,
    );

    const fechaPasadaIso = fechaHoraUtcNaive(
      fechaCalendarioClinicaConDesplazamiento(-2),
      11,
    );

    const insertRes = await dataSource.query(
      `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
       VALUES
         ($1, $2, $3, 'ACTIVO', 5000),
         ($1, $2, $4, 'ACTIVO', 5000),
         ($1, $2, $3, 'CANCELADO', 5000),
         ($1, $5, $6, 'ACTIVO', 5000),
         ($1, $2, $7, 'ACTIVO', 5000)
       RETURNING id, estado;`,
      [
        idMedico1,
        idPaciente1,
        fechaFuturaIso,
        fechaHoyIso,
        idPaciente2,
        fechaFuturaP2Iso,
        fechaPasadaIso,
      ],
    );

    idReservaFuturaP1 = insertRes[0].id;
    idReservaHoyP1 = insertRes[1].id;
    idReservaCanceladaP1 = insertRes[2].id;
    idReservaFuturaP2 = insertRes[3].id;
    idReservaPasadaP1 = insertRes[4].id;

    insertedReservaIds.push(
      idReservaFuturaP1,
      idReservaHoyP1,
      idReservaCanceladaP1,
      idReservaFuturaP2,
      idReservaPasadaP1,
    );
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

  describe('Casos de éxito y transición de estado', () => {
    it('debe cancelar exitosamente con 200 OK si el paciente es dueño y tiene antelación suficiente', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaFuturaP1}/cancelacion`)
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', idReservaFuturaP1);
      expect(response.body).toHaveProperty('estado', 'CANCELADO');

      // Verificar persistencia real en la base de datos
      const rows = await dataSource.query(
        'SELECT estado FROM reservas WHERE id = $1',
        [idReservaFuturaP1],
      );
      expect(rows[0].estado).toBe('CANCELADO');
    });
  });

  describe('Regla de anticipación y corte de medianoche', () => {
    it('debe rechazar con 400 Bad Request si la cancelación es el mismo día del turno', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaHoyP1}/cancelacion`)
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(400);

      expect(response.body.message).toBe(
        'Solo se puede cancelar hasta 1 dia antes de la fecha del turno.',
      );
    });
  });

  describe('Seguridad y autorización', () => {
    it('debe rechazar con 403 Forbidden si otro paciente intenta cancelar la reserva', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaHoyP1}/cancelacion`)
        .set('Authorization', `Bearer ${paciente2Token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('debe rechazar con 403 Forbidden si un rol no autorizado (ej: MEDICO) intenta cancelar', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaHoyP1}/cancelacion`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('debe rechazar con 401 Unauthorized sin token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaHoyP1}/cancelacion`)
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('Conflictos y estados terminales', () => {
    it('debe rechazar con 409 Conflict si la reserva ya no está en estado ACTIVO', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaCanceladaP1}/cancelacion`)
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(409);

      expect(response.status).toBe(409);
    });

    it('debe rechazar con 404 Not Found si la reserva no existe', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/reservas/999999/cancelacion')
        .set('Authorization', `Bearer ${paciente1Token}`)
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Rol ADMINISTRADOR - Cancelación y regla temporal extendida', () => {
    it('debe permitir al administrador cancelar exitosamente con 200 OK cualquier turno activo sin restricción de titularidad', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaFuturaP2}/cancelacion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', idReservaFuturaP2);
      expect(response.body).toHaveProperty('estado', 'CANCELADO');

      // Verificar persistencia real en la base de datos
      const rows = await dataSource.query(
        'SELECT estado FROM reservas WHERE id = $1',
        [idReservaFuturaP2],
      );
      expect(rows[0].estado).toBe('CANCELADO');
    });

    it('debe liberar el slot tras la cancelación permitiendo que se agende una nueva reserva en el mismo horario', async () => {
      // Al encontrarse idReservaFuturaP2 en estado CANCELADO, el índice único parcial
      // (id_medico, fecha_hora) WHERE estado != 'CANCELADO' permite un nuevo INSERT ACTIVO
      const nuevoTurnoRes = await dataSource.query(
        `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
         VALUES ($1, $2, $3, 'ACTIVO', 5000)
         RETURNING id, estado;`,
        [idMedico1, idPaciente1, fechaFuturaP2Iso],
      );

      expect(nuevoTurnoRes[0]).toHaveProperty('id');
      expect(nuevoTurnoRes[0].estado).toBe('ACTIVO');
      insertedReservaIds.push(nuevoTurnoRes[0].id);
    });

    it('debe rechazar con 400 Bad Request si el administrador intenta cancelar una consulta médica que ya inició o transcurrió en el pasado', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaPasadaP1}/cancelacion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe(
        'No se puede cancelar una consulta médica que ya ha iniciado o transcurrido en el pasado.',
      );
    });

    it('debe rechazar con 409 Conflict si el administrador intenta cancelar una reserva que no está en estado ACTIVO', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/reservas/${idReservaCanceladaP1}/cancelacion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(response.status).toBe(409);
    });

    it('debe rechazar con 404 Not Found si el administrador intenta cancelar una reserva inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/reservas/999999/cancelacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.status).toBe(404);
    });
  });
});
