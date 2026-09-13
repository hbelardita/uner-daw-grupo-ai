import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Bootstrap de la Aplicación y Ruteo Global (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito', () => {
    it('debe responder 200 en /api/health demostrando que el prefijo global /api rutea correctamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
    });

    it('debe servir la interfaz de Swagger UI en /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect((res) => {
          expect([200, 301]).toContain(res.status);
        });

      if (response.status === 301) {
        await request(app.getHttpServer())
          .get('/api/docs/')
          .expect(200)
          .expect('Content-Type', /html/);
      }
    });

    it('debe exponer la especificación OpenAPI JSON en /api/docs-json con la metadata configurada', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body.info.title).toBe(
        'Sistema de Gestión de Turnos Médicos',
      );
      expect(response.body.info.version).toBe('1.0');
    });
  });

  describe('Errores esperados', () => {
    it('debe responder 404 en la raíz / al requerirse el prefijo global /api', async () => {
      await request(app.getHttpServer()).get('/').expect(404);
    });

    it('debe responder 404 en /api/v1 al no existir un controlador raíz en la API', async () => {
      await request(app.getHttpServer()).get('/api/v1').expect(404);
    });

    it('debe responder 404 ante rutas inexistentes bajo el prefijo global /api/v1/no-existe', async () => {
      await request(app.getHttpServer()).get('/api/v1/no-existe').expect(404);
    });
  });

  describe('Casos borde (edge cases)', () => {
    it('debe incluir cabeceras de seguridad Helmet en las respuestas HTTP', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('debe incluir cabeceras CORS para el origen permitido cuando se especifica Origin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:4200')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:4200',
      );
    });
  });
});
