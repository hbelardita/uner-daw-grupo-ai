import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Módulo de Healthcheck (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito', () => {
    it('debe responder 200 OK en GET /api/health con las métricas de PostgreSQL y estructura esperada', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'success',
          message: expect.any(String),
          version: expect.any(String),
          timestamp: expect.any(String),
          database: expect.objectContaining({
            status: 'connected',
            version: expect.any(String),
            max_connections: expect.any(Number),
            active_connections: expect.any(Number),
          }),
        }),
      );

      expect(response.body.database.max_connections).toBeGreaterThan(0);
      expect(response.body.database.active_connections).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('debe responder sin requerir el prefijo de versionado v1 respetando el prefijo global /api', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');
      expect(response.status).toBe(200);

      // Al estar configurado con VERSION_NEUTRAL, no debe responder en /api/v1/health
      const versionedResponse = await request(app.getHttpServer()).get(
        '/api/v1/health',
      );
      expect(versionedResponse.status).toBe(404);
    });
  });

  describe('Errores esperados', () => {
    it('debe responder 503 Service Unavailable y reportar database disconnected cuando la base de datos falla', async () => {
      const querySpy = vi
        .spyOn(dataSource, 'query')
        .mockRejectedValueOnce(new Error('Simulated database connection loss'));

      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(503);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'error',
          message: expect.any(String),
          version: expect.any(String),
          timestamp: expect.any(String),
          database: expect.objectContaining({
            status: 'disconnected',
            error: expect.any(String),
          }),
        }),
      );

      querySpy.mockRestore();
    });
  });

  describe('Casos borde (edge cases)', () => {
    it('debe rechazar métodos HTTP no configurados como POST /api/health con 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/health')
        .send({});
      expect(response.status).toBe(404);
    });
  });
});
