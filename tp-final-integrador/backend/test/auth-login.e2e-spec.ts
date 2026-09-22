import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Autenticación - Endpoint de Login (e2e)', () => {
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
    it('debe iniciar sesión con credenciales válidas de médico (20111111) y retornar 200 OK con token JWT conteniendo sub, rol e idMedico', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_ficticia_1',
        })
        .expect(200);

      expect(response.body).toEqual({
        token: expect.any(String),
      });
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3);

      const payload = JSON.parse(
        Buffer.from(response.body.token.split('.')[1], 'base64url').toString(
          'utf8',
        ),
      );
      expect(payload).toHaveProperty('sub', 1);
      expect(payload).toHaveProperty('rol', 'MEDICO');
      expect(payload).toHaveProperty('idMedico', 1);
    });

    it('debe iniciar sesión con credenciales válidas de paciente (30111111) y retornar 200 OK con token JWT sin idMedico', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '30111111',
          clave: 'clave_ficticia_5',
        })
        .expect(200);

      expect(response.body).toEqual({
        token: expect.any(String),
      });
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3);

      const payload = JSON.parse(
        Buffer.from(response.body.token.split('.')[1], 'base64url').toString(
          'utf8',
        ),
      );
      expect(payload).toHaveProperty('sub', 5);
      expect(payload).toHaveProperty('rol', 'PACIENTE');
      expect(payload.idMedico).toBeUndefined();
    });

    it('debe iniciar sesión con credenciales válidas de administrador (40111111) y retornar 200 OK con token JWT sin idMedico', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '40111111',
          clave: 'clave_ficticia_10',
        })
        .expect(200);

      expect(response.body).toEqual({
        token: expect.any(String),
      });
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3);

      const payload = JSON.parse(
        Buffer.from(response.body.token.split('.')[1], 'base64url').toString(
          'utf8',
        ),
      );
      expect(payload).toHaveProperty('sub', 10);
      expect(payload).toHaveProperty('rol', 'ADMINISTRADOR');
      expect(payload.idMedico).toBeUndefined();
    });
  });

  describe('Errores esperados', () => {
    it('debe rechazar con 401 Unauthorized cuando el documento no existe en el sistema', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '99999999',
          clave: 'clave_inexistente',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('debe rechazar con 401 Unauthorized cuando la contraseña es incorrecta', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_erronea_totalmente',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('debe rechazar con 401 Unauthorized y mensaje idéntico cuando el usuario existe pero se encuentra en estado BAJA (médico 20444444)', async () => {
      const badCredentialsResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_erronea',
        })
        .expect(401);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20444444',
          clave: 'clave_ficticia_4',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(badCredentialsResponse.body.message);
    });

    it('debe rechazar con 401 Unauthorized y mensaje idéntico cuando el usuario existe pero se encuentra en estado BAJA (paciente 30555555)', async () => {
      const badCredentialsResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_erronea',
        })
        .expect(401);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '30555555',
          clave: 'clave_ficticia_9',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(badCredentialsResponse.body.message);
    });

    it('debe rechazar con 401 Unauthorized y mensaje idéntico cuando el usuario existe pero se encuentra en estado BAJA (administrador 40222222)', async () => {
      const badCredentialsResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_erronea',
        })
        .expect(401);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '40222222',
          clave: 'clave_ficticia_11',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(badCredentialsResponse.body.message);
    });
  });

  describe('Casos borde (edge cases)', () => {
    it('debe responder 400 Bad Request si el body está vacío', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });

    it('debe responder 400 Bad Request si los campos documento o clave son cadenas vacías', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '',
          clave: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });

    it('debe responder 400 Bad Request si documento o clave no son strings', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: 12345678,
          clave: 9999,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });

    it('debe responder 400 Bad Request cuando se envían campos adicionales no permitidos (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_ficticia_1',
          campoExtraProhibido: 'ataque_o_malformacion',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });
  });
});
