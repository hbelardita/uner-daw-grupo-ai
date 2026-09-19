import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Autenticación - AuthGuard y Decorador @CurrentUser (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let doctorToken: string;
  let pacienteToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    jwtService = app.get(JwtService);

    // Obtener tokens reales mediante POST /api/v1/auth/login
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

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        documento: '40111111',
        clave: 'clave_ficticia_10',
      })
      .expect(200);
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito (happy path)', () => {
    it('debe responder 200 OK con los datos del médico autenticado (sub: 1, rol: MEDICO, idMedico: 1) en GET /api/v1/auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body).toEqual({
        sub: 1,
        rol: 'MEDICO',
        email: 'ana.gomez@clinica.test',
        idMedico: 1,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('debe responder 200 OK con los datos del paciente autenticado (sub: 5, rol: PACIENTE, sin idMedico) en GET /api/v1/auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .expect(200);

      expect(response.body).toEqual({
        sub: 5,
        rol: 'PACIENTE',
        email: 'julia.fernandez@mail.test',
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
      expect(response.body.idMedico).toBeUndefined();
    });

    it('debe responder 200 OK con los datos del administrador autenticado (sub: 10, rol: ADMINISTRADOR) en GET /api/v1/auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        sub: 10,
        rol: 'ADMINISTRADOR',
        email: 'valeria.acosta@clinica.test',
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
      expect(response.body.idMedico).toBeUndefined();
    });
  });

  describe('Errores esperados (expected errors)', () => {
    it('debe rechazar con 401 Unauthorized si no se envía la cabecera Authorization', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Token de sesión no proporcionado',
      );
    });

    it('debe rechazar con 401 Unauthorized si se envía un esquema no Bearer (ej. Basic)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Token de sesión no proporcionado',
      );
    });

    it('debe rechazar con 401 Unauthorized si la cabecera es Bearer pero sin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Token de sesión no proporcionado',
      );
    });

    it('debe rechazar con 401 Unauthorized cuando el token JWT está adulterado (firma incorrecta)', async () => {
      const tamperedToken = doctorToken.slice(0, -5) + 'xxxxx';
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token de sesión');
    });

    it('debe rechazar con 401 Unauthorized cuando el token JWT está expirado', async () => {
      const expiredToken = await jwtService.signAsync(
        {
          sub: 1,
          rol: 'MEDICO',
          email: 'ana.gomez@clinica.test',
        },
        {
          expiresIn: -10,
        },
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token de sesión');
    });

    it('debe rechazar con 401 Unauthorized cuando el token es una cadena malformada no JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token_invalido_totalmente_malformado')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token de sesión');
    });
  });

  describe('Casos borde (edge cases)', () => {
    it('debe manejar correctamente espacios múltiples tras Bearer y responder 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer    ${doctorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sub', 1);
      expect(response.body).toHaveProperty('rol', 'MEDICO');
    });

    it('debe rechazar con 401 Unauthorized si se usa minúscula en "bearer" (esquema estricto Bearer)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `bearer ${doctorToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Token de sesión no proporcionado',
      );
    });

    it('debe permitir que rutas públicas como GET /api/health y POST /api/v1/auth/login continúen funcionando sin cabecera Authorization', async () => {
      const healthResponse = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('status', 'success');

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          documento: '20111111',
          clave: 'clave_ficticia_1',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });
  });
});
