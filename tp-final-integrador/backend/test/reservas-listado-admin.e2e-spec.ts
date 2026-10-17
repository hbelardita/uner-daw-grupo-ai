import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

function idsDe(respuesta: { body: { data: { id: number }[] } }): number[] {
  return respuesta.body.data.map((reserva) => reserva.id);
}

describe('Endpoint GET /api/v1/reservas - Listado global de turnos (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let pacienteToken: string;
  let medicoToken: string;

  let idPaciente1: number;
  let idPaciente2: number;
  let idMedico1: number;
  let idMedico2: number;

  let insertedReservaIds: number[] = [];
  let reservaActivoId: number;
  let reservaAtendidoId: number;
  let reservaCanceladoId: number;
  let reservaOtroMedicoId: number;

  const FECHA_CON_TURNOS = '2026-12-01';
  const LIMITE_POR_DEFECTO = 10;
  const PAGINA_POR_DEFECTO = 1;

  async function login(documento: string, clave: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento, clave })
      .expect(200);
    return response.body.token;
  }

  function listar(query: string, token: string) {
    return request(app.getHttpServer())
      .get(`/api/v1/reservas${query}`)
      .set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);

    adminToken = await login('40111111', 'clave_ficticia_10');
    pacienteToken = await login('30111111', 'clave_ficticia_5');
    medicoToken = await login('20111111', 'clave_ficticia_1');

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

    // Turnos propios en un mes que ningún otro spec usa, para que los
    // conteos de los filtros por fecha sean deterministas.
    const insertadas = await dataSource.query(
      `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
       VALUES
         ($1, $2, '2026-12-01 09:00:00', 'ACTIVO', 5000),
         ($3, $2, '2026-12-02 10:00:00', 'ATENDIDO', 5000),
         ($4, $5, '2026-12-03 11:00:00', 'CANCELADO', 5000),
         ($6, $7, '2026-12-01 09:00:00', 'ACTIVO', 4500)
       RETURNING id;`,
      [
        idMedico1,
        idPaciente1,
        idMedico1,
        idMedico2,
        idPaciente2,
        idMedico2,
        idPaciente2,
      ],
    );
    insertedReservaIds = insertadas.map((r: { id: number }) => r.id);
    [
      reservaActivoId,
      reservaAtendidoId,
      reservaCanceladoId,
      reservaOtroMedicoId,
    ] = insertedReservaIds;
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

  describe('Contrato de la respuesta', () => {
    it('devuelve el objeto paginado con la estructura exacta del DTO', async () => {
      const response = await listar('', adminToken).expect(200);

      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.meta).toEqual({
        total: expect.any(Number),
        pagina: PAGINA_POR_DEFECTO,
        limite: LIMITE_POR_DEFECTO,
        totalPaginas: expect.any(Number),
      });
      expect(response.body.meta.total).toBeGreaterThanOrEqual(
        response.body.data.length,
      );
      expect(response.body.meta.totalPaginas).toBe(
        Math.ceil(response.body.meta.total / LIMITE_POR_DEFECTO),
      );

      for (const item of response.body.data) {
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
          paciente: {
            id: expect.any(Number),
            nombres: expect.any(String),
            apellidos: expect.any(String),
            documento: expect.any(String),
          },
        });
        expect(new Date(item.fechaHora).toISOString()).toBe(item.fechaHora);
      }
    });

    it('ordena el listado de forma cronológica ascendente', async () => {
      const response = await listar('?limite=100', adminToken).expect(200);

      const orden = response.body.data.map((reserva: { fechaHora: string }) =>
        new Date(reserva.fechaHora).getTime(),
      );
      expect(orden).toEqual(orden.toSorted((a, b) => a - b));
    });
  });

  describe('Filtros multicriterio', () => {
    it('filtra por día ignorando la hora del turno', async () => {
      const response = await listar(
        `?fecha=${FECHA_CON_TURNOS}`,
        adminToken,
      ).expect(200);

      expect(response.body.meta.total).toBe(2);
      expect(idsDe(response)).toEqual(
        expect.arrayContaining([reservaActivoId, reservaOtroMedicoId]),
      );
      for (const item of response.body.data) {
        expect(item.fechaHora).toContain(FECHA_CON_TURNOS);
      }
    });

    it('filtra por estado', async () => {
      const response = await listar('?estado=CANCELADO', adminToken).expect(
        200,
      );

      expect(idsDe(response)).toContain(reservaCanceladoId);
      for (const item of response.body.data) {
        expect(item.estado).toBe('CANCELADO');
      }
    });

    it('filtra por médico combinado con fecha', async () => {
      const response = await listar(
        `?fecha=${FECHA_CON_TURNOS}&idMedico=${idMedico2}`,
        adminToken,
      ).expect(200);

      expect(response.body.meta.total).toBe(1);
      expect(idsDe(response)).toEqual([reservaOtroMedicoId]);
    });

    it('filtra por paciente combinado con fecha', async () => {
      const response = await listar(
        `?fecha=2026-12-03&idPaciente=${idPaciente2}`,
        adminToken,
      ).expect(200);

      expect(response.body.meta.total).toBe(1);
      expect(idsDe(response)).toEqual([reservaCanceladoId]);
    });

    it('filtra por documento del paciente', async () => {
      const response = await listar(
        '?documentoPaciente=30111111&estado=ATENDIDO',
        adminToken,
      ).expect(200);

      expect(idsDe(response)).toContain(reservaAtendidoId);
      for (const item of response.body.data) {
        expect(item.paciente.documento).toBe('30111111');
        expect(item.estado).toBe('ATENDIDO');
      }
    });

    it('devuelve un listado vacío cuando los filtros no tienen coincidencias', async () => {
      const response = await listar('?fecha=2000-01-01', adminToken).expect(
        200,
      );

      expect(response.body.data).toEqual([]);
      expect(response.body.meta).toEqual({
        total: 0,
        pagina: PAGINA_POR_DEFECTO,
        limite: LIMITE_POR_DEFECTO,
        totalPaginas: 0,
      });
    });

    it('ignora los filtros enviados vacíos en lugar de aplicarlos como valor', async () => {
      const sinFiltros = await listar('', adminToken).expect(200);
      const vacios = await listar(
        '?fecha=&idMedico=&idPaciente=&documentoPaciente=&estado=&pagina=&limite=',
        adminToken,
      ).expect(200);

      expect(vacios.body.meta.total).toBe(sinFiltros.body.meta.total);
      expect(vacios.body.meta.total).toBeGreaterThan(0);
      expect(vacios.body.meta.pagina).toBe(PAGINA_POR_DEFECTO);
      expect(vacios.body.meta.limite).toBe(LIMITE_POR_DEFECTO);
    });
  });

  describe('Validación de parámetros', () => {
    it('rechaza una fecha con formato incorrecto', async () => {
      const response = await listar('?fecha=2026-2-3', adminToken).expect(400);

      expect(response.body.message).toContain(
        'La fecha debe tener formato AAAA-MM-DD.',
      );
    });

    it.each([['2026-13-45'], ['2026-02-31'], ['2026-02-29']])(
      'rechaza la fecha de calendario inexistente %s sin llegar a la base',
      async (fecha) => {
        const response = await listar(`?fecha=${fecha}`, adminToken).expect(
          400,
        );

        expect(response.body.message).toContain(
          'La fecha debe ser una fecha de calendario válida.',
        );
      },
    );

    it.each([
      ['?pagina=0', 'El parámetro pagina debe ser mayor o igual a 1.'],
      ['?pagina=abc', 'El parámetro pagina debe ser un número entero.'],
      ['?limite=0', 'El parámetro limite debe ser mayor o igual a 1.'],
      ['?idMedico=abc', 'El idMedico debe ser un número entero.'],
      ['?idPaciente=1.5', 'El idPaciente debe ser un número entero.'],
      [
        '?estado=INVENTADO',
        'El estado debe ser uno de los valores válidos: ACTIVO, ATENDIDO, AUSENTE, CANCELADO.',
      ],
    ])('rechaza el parámetro inválido %s', async (query, mensaje) => {
      const response = await listar(query, adminToken).expect(400);

      expect(response.body.message).toContain(mensaje);
    });

    it('rechaza parámetros de consulta desconocidos', async () => {
      const response = await listar('?foo=1', adminToken).expect(400);

      expect(response.body.message).toContain('property foo should not exist');
    });
  });

  describe('Paginación', () => {
    it('devuelve páginas disjuntas y un total estable', async () => {
      const primera = await listar('?pagina=1&limite=2', adminToken).expect(
        200,
      );
      const segunda = await listar('?pagina=2&limite=2', adminToken).expect(
        200,
      );

      expect(primera.body.meta.total).toBe(segunda.body.meta.total);
      expect(primera.body.meta.totalPaginas).toBe(
        Math.ceil(primera.body.meta.total / 2),
      );
      expect(idsDe(primera)).toHaveLength(2);
      expect(idsDe(segunda)).toHaveLength(2);
      expect(idsDe(primera)).not.toEqual(
        expect.arrayContaining(idsDe(segunda)),
      );
    });

    it('devuelve una página vacía cuando se pide una página fuera de rango', async () => {
      const response = await listar('?pagina=999', adminToken).expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.pagina).toBe(999);
    });
  });

  describe('Contrato del historial de paciente y autorización', () => {
    it('mantiene el array plano con orden descendente para el paciente', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const orden = response.body.map((reserva: { fechaHora: string }) =>
        new Date(reserva.fechaHora).getTime(),
      );
      expect(orden).toEqual(orden.toSorted((a, b) => b - a));
      for (const item of response.body) {
        expect(item).not.toHaveProperty('paciente');
        expect(item).not.toHaveProperty('idPaciente');
      }
    });

    it('ignora los parámetros de consulta del paciente en lugar de rechazarlos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reservas?pagina=1&fecha=2026-01-01')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it.each([['/api/v1/reservas', 'medicoToken']])(
      'devuelve 403 en %s para el rol sin permiso',
      async (ruta, rol) => {
        const tokens: Record<string, string> = {
          adminToken,
          pacienteToken,
          medicoToken,
        };

        const response = await request(app.getHttpServer())
          .get(ruta)
          .set('Authorization', `Bearer ${tokens[rol]}`)
          .expect(403);

        expect(response.status).toBe(403);
      },
    );

    it.each([['/api/v1/reservas']])(
      'devuelve 401 en %s sin token de sesión',
      async (ruta) => {
        const response = await request(app.getHttpServer())
          .get(ruta)
          .expect(401);

        expect(response.status).toBe(401);
      },
    );
  });
});
