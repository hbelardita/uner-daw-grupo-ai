import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

class TestValidationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Controller()
class TestAppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('test-validation')
  @HttpCode(HttpStatus.OK)
  testValidation(@Body() dto: TestValidationDto) {
    return {
      success: true,
      data: dto,
    };
  }
}

describe('App Bootstrap & Routing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestAppController],
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

  describe('Routing & Global Prefix', () => {
    it('debe responder 404 en la raíz / al estar activo el prefijo global /api', async () => {
      await request(app.getHttpServer()).get('/').expect(404);
    });

    it('debe responder 200 en /api/v1 con el saludo esperado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(200);

      expect(response.text).toBe('Hello World!');
    });
  });

  describe('Swagger Documentation', () => {
    it('debe servir la interfaz de Swagger UI en /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect((res) => {
          // Express / Swagger UI can return 200 or 301 redirect to /api/docs/
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

  describe('Security Headers & CORS', () => {
    it('debe incluir cabeceras de seguridad Helmet', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(200);

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('debe incluir cabeceras CORS para el origen permitido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .set('Origin', 'http://localhost:4200')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:4200',
      );
    });
  });

  describe('ValidationPipe global', () => {
    it('debe aceptar payloads válidos que cumplan con el DTO', async () => {
      const validPayload = { name: 'Dr. René Favaloro' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send(validPayload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: validPayload,
      });
    });

    it('debe rechazar payloads con campos que violen las reglas de validación (400 Bad Request)', async () => {
      const invalidPayload = { name: 12345 };

      const response = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('debe rechazar payloads con campos no permitidos o desconocidos mediante forbidNonWhitelisted (400 Bad Request)', async () => {
      const unknownPropPayload = {
        name: 'Dr. René Favaloro',
        injectedField: 'malicious_data',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send(unknownPropPayload)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('property injectedField should not exist'),
        ]),
      );
    });
  });
});
