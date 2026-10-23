import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { fechaCalendarioClinicaConDesplazamiento } from './setup/fechas.js';

/** Franja de atención de la clínica expresada en hora de Argentina (UTC-3). */
const HORA_APERTURA_ARGENTINA = 8;
const HORA_CIERRE_ARGENTINA = 15;
const OFFSET_UTC_ARGENTINA = 3;

/** Primer día hábil de la clínica a partir del desplazamiento indicado. */
function proximoDiaHabil(desplazamientoMinimo: number): string {
  for (let dias = desplazamientoMinimo; dias <= 30; dias += 1) {
    const fechaIso = fechaCalendarioClinicaConDesplazamiento(dias);
    const diaSemana = new Date(`${fechaIso}T12:00:00-03:00`).getUTCDay();

    if (diaSemana !== 0 && diaSemana !== 6) {
      return fechaIso;
    }
  }

  throw new Error('No se encontró un día hábil en la ventana de reserva.');
}

/**
 * Regresión del issue #24: la columna `reservas.fecha_hora` persiste UTC y la
 * constraint `chk_reservas_horario_atencion` debe evaluar la franja de atención
 * en la zona de la clínica, no sobre la hora UTC en crudo.
 */
describe('Contrato UTC de reservas y franja horaria de atención (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let pacienteToken: string;
  let idMedico: number;
  let idPaciente: number;

  const insertedReservaIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);

    const loginPaciente = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ documento: '30111111', clave: 'clave_ficticia_5' })
      .expect(200);
    pacienteToken = loginPaciente.body.token;

    const medicoRes = await dataSource.query(
      `SELECT m.id FROM medicos m
       JOIN usuarios u ON u.id = m.id_usuario
       WHERE u.documento = '20111111'`,
    );
    idMedico = medicoRes[0].id;

    const pacienteRes = await dataSource.query(
      "SELECT id FROM usuarios WHERE documento = '30111111'",
    );
    idPaciente = pacienteRes[0].id;
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

  it('debe aceptar un turno de las 15:00 de Argentina (18:00 UTC)', async () => {
    const fechaIso = proximoDiaHabil(3);

    const response = await request(app.getHttpServer())
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({ idMedico, fechaHora: `${fechaIso}T15:00:00-03:00` })
      .expect(201);

    insertedReservaIds.push(response.body.id);

    expect(response.body.fechaHora).toBe(`${fechaIso}T18:00:00.000Z`);

    const filas = await dataSource.query(
      'SELECT fecha_hora::text AS fecha_hora FROM reservas WHERE id = $1',
      [response.body.id],
    );
    expect(filas[0].fecha_hora).toBe(`${fechaIso} 18:00:00`);
  });

  it('debe aceptar un turno de las 08:00 de Argentina (11:00 UTC)', async () => {
    const fechaIso = proximoDiaHabil(3);

    const response = await request(app.getHttpServer())
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${pacienteToken}`)
      .send({ idMedico, fechaHora: `${fechaIso}T08:00:00-03:00` })
      .expect(201);

    insertedReservaIds.push(response.body.id);

    expect(response.body.fechaHora).toBe(`${fechaIso}T11:00:00.000Z`);
  });

  it('debe rechazar en base un turno de las 16:00 de Argentina (fuera de la franja)', async () => {
    const fechaIso = proximoDiaHabil(3);
    const horaFueraDeFranja = HORA_CIERRE_ARGENTINA + 1 + OFFSET_UTC_ARGENTINA;

    await expect(
      dataSource.query(
        `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
         VALUES ($1, $2, $3, 'ACTIVO', 5000)`,
        [idMedico, idPaciente, `${fechaIso} ${horaFueraDeFranja}:00:00`],
      ),
    ).rejects.toThrow(/chk_reservas_horario_atencion/);
  });

  it('debe aceptar en base un turno de las 08:00 de Argentina (11:00 UTC)', async () => {
    const fechaIso = proximoDiaHabil(4);
    const horaAperturaUtc = HORA_APERTURA_ARGENTINA + OFFSET_UTC_ARGENTINA;

    const filas = await dataSource.query(
      `INSERT INTO reservas (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
       VALUES ($1, $2, $3, 'ACTIVO', 5000)
       RETURNING id`,
      [idMedico, idPaciente, `${fechaIso} ${horaAperturaUtc}:00:00`],
    );

    insertedReservaIds.push(filas[0].id);
    expect(filas[0].id).toBeGreaterThan(0);
  });
});
