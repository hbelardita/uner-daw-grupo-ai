import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { fechaHoraUtcNaive } from './setup/fechas.js';

describe('Endpoint PATCH /api/v1/medicos/:id/valor-consulta (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let doctorToken: string;
  let pacienteToken: string;
  let idMedicoExistente: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);

    // Obtener tokens mediante login con credenciales sembradas en seed
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '40111111',
        clave: 'clave_ficticia_10',
      })
      .expect(200);
    adminToken = adminLogin.body.token;

    const doctorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '20111111',
        clave: 'clave_ficticia_1',
      })
      .expect(200);
    doctorToken = doctorLogin.body.token;

    const pacienteLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '30111111',
        clave: 'clave_ficticia_5',
      })
      .expect(200);
    pacienteToken = pacienteLogin.body.token;

    // Obtener el ID real del primer médico sembrado en la BD
    const medicoResult = await dataSource.query(
      `SELECT m.id, m.valor_consulta FROM medicos m
       JOIN usuarios u ON u.id = m.id_usuario
       WHERE u.documento = '20111111' LIMIT 1`,
    );
    idMedicoExistente = medicoResult[0].id;
  });

  afterAll(async () => {
    if (dataSource && idMedicoExistente) {
      await dataSource.query(
        'UPDATE medicos SET valor_consulta = 5000 WHERE id = $1',
        [idMedicoExistente],
      );
    }
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito (200 OK) y Persistencia / Aislamiento Histórico', () => {
    it('debe actualizar el honorario a 8500 y devolver 200 OK con el DTO actualizado cuando el Administrador lo solicita', async () => {
      const nuevoValor = 8500;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: nuevoValor })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: idMedicoExistente,
        matricula: 1001,
        valorConsulta: nuevoValor,
        nombres: 'Ana',
        apellidos: 'Gomez',
      });

      // Verificar persistencia en base de datos
      const medicoEnBd = await dataSource.query(
        'SELECT valor_consulta FROM medicos WHERE id = $1',
        [idMedicoExistente],
      );
      expect(medicoEnBd[0].valor_consulta).toBe(nuevoValor);
    });

    it('debe mantener intacto el valor congelado en reservas previas (aislamiento histórico)', async () => {
      // 1. Obtener un paciente existente
      const pacienteResult = await dataSource.query(
        "SELECT id FROM usuarios WHERE rol = 'PACIENTE' AND estado = 'ACTIVO' LIMIT 1",
      );
      const idPaciente = pacienteResult[0].id;

      // 2. Insertar una reserva previa con un honorario histórico congelado (ej: 4200).
      // La franja es 10:00 de Argentina, que se persiste como las 13:00 UTC.
      const valorHistoricoCongelado = 4200;
      const reservaInsertada = await dataSource.query(
        `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
         VALUES ($1, $2, $4, 'ACTIVO', $3)
         RETURNING id, valor_consulta`,
        [
          idMedicoExistente,
          idPaciente,
          valorHistoricoCongelado,
          fechaHoraUtcNaive('2026-11-20', 10),
        ],
      );
      const idReserva = reservaInsertada[0].id;

      // 3. El Administrador actualiza nuevamente el honorario vigente del médico a 9000
      const nuevoValorVigente = 9000;
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: nuevoValorVigente })
        .expect(200);

      expect(response.status).toBe(200);

      // 4. Verificar que la reserva histórica previa NO se vio afectada y mantiene sus 4200
      const reservaConsultada = await dataSource.query(
        'SELECT valor_consulta FROM reservas WHERE id = $1',
        [idReserva],
      );
      expect(reservaConsultada[0].valor_consulta).toBe(valorHistoricoCongelado);

      // Limpieza de la reserva de prueba
      await dataSource.query('DELETE FROM reservas WHERE id = $1', [idReserva]);
    });
  });

  describe('Control de acceso y Autorización (Ruta y Seguridad)', () => {
    it('debe rechazar con 403 Forbidden cuando un usuario con rol MEDICO intenta actualizar el honorario', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ valorConsulta: 6000 })
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('debe rechazar con 403 Forbidden cuando un usuario con rol PACIENTE intenta actualizar el honorario', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({ valorConsulta: 6000 })
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('debe rechazar con 401 Unauthorized si no se envía la cabecera Authorization', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .send({ valorConsulta: 6000 })
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('debe rechazar con 401 Unauthorized si el token JWT es inválido o corrupto', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', 'Bearer token_invalido_jwt')
        .send({ valorConsulta: 6000 })
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('Estado del profesional', () => {
    it('debe rechazar con 409 Conflict si el médico está dado de baja y no modificar su honorario', async () => {
      const usuarioCreado = await dataSource.query(
        `INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol)
         VALUES ('99999990', 'Baja', 'Baja', 'baja@ejemplo.test', 'sin-uso', 'BAJA', 'MEDICO')
         RETURNING id`,
      );
      const idUsuarioBaja = usuarioCreado[0].id;

      const medicoCreado = await dataSource.query(
        `INSERT INTO medicos (id_usuario, matricula, valor_consulta)
         VALUES ($1, 999990, 7000) RETURNING id`,
        [idUsuarioBaja],
      );
      const idMedicoBaja = medicoCreado[0].id;

      try {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/medicos/${idMedicoBaja}/valor-consulta`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ valorConsulta: 9000 })
          .expect(409);

        expect(response.body.message).toContain('estado BAJA');

        const medicoEnBd = await dataSource.query(
          'SELECT valor_consulta FROM medicos WHERE id = $1',
          [idMedicoBaja],
        );
        expect(medicoEnBd[0].valor_consulta).toBe(7000);
      } finally {
        await dataSource.query('DELETE FROM medicos WHERE id = $1', [
          idMedicoBaja,
        ]);
        await dataSource.query('DELETE FROM usuarios WHERE id = $1', [
          idUsuarioBaja,
        ]);
      }
    });
  });

  describe('Validación de Parámetros de Ruta y Body', () => {
    it('debe responder 400 Bad Request si el parámetro :id no es numérico entero', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/medicos/invalido/valor-consulta')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: 5000 })
        .expect(400);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
    });

    it('debe responder 404 Not Found si el médico no existe en el sistema', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/medicos/999999/valor-consulta')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: 5000 })
        .expect(404);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain(
        'No se encontró el médico con id 999999',
      );
    });

    it('debe responder 400 Bad Request si valorConsulta es 0', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: 0 })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('debe responder 400 Bad Request si valorConsulta es negativo', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: -500 })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('debe responder 400 Bad Request si valorConsulta es un número con decimales (no entero)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: 5500.75 })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('debe responder 400 Bad Request si el body está vacío', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('debe responder 400 Bad Request si se envían propiedades adicionales no permitidas (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/medicos/${idMedicoExistente}/valor-consulta`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valorConsulta: 5000, campoExtra: 'invalido' })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});
