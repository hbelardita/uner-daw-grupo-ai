import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';
import { TOKEN_KEY } from './token-storage';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    cerrarSesion: ReturnType<typeof vi.fn>;
    estaAutenticado: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    authServiceMock = {
      cerrarSesion: vi.fn(),
      estaAutenticado: vi.fn(() => false),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('casos de éxito', () => {
    it('debe inyectar la cabecera Authorization con Bearer cuando existe token en localStorage', () => {
      const tokenPrueba = 'jwt.payload.firma';
      localStorage.setItem(TOKEN_KEY, tokenPrueba);

      httpClient.get('/api/v1/test').subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.has('Authorization')).toBe(true);
      expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${tokenPrueba}`);
      peticion.flush({});
    });

    it('debe preservar las cabeceras preexistentes al inyectar el token', () => {
      const tokenPrueba = 'jwt.payload.firma';
      localStorage.setItem(TOKEN_KEY, tokenPrueba);
      const headers = new HttpHeaders({ 'X-Custom-Header': 'valor-personalizado' });

      httpClient.get('/api/v1/test', { headers }).subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.get('X-Custom-Header')).toBe('valor-personalizado');
      expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${tokenPrueba}`);
      peticion.flush({});
    });
  });

  describe('errores esperados y ausencia de token', () => {
    it('no debe agregar la cabecera Authorization si no existe token en localStorage', () => {
      httpClient.get('/api/v1/test').subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });
  });

  describe('manejo de sesión expirada y respuestas con error', () => {
    it('debe cerrar sesión y propagar el error cuando una petición con token responde 401', () => {
      const tokenPrueba = 'jwt.payload.firma';
      localStorage.setItem(TOKEN_KEY, tokenPrueba);
      let errorRecibido: unknown;

      httpClient.get('/api/v1/test').subscribe({
        next: () => expect.fail('no debía resolverse exitosamente'),
        error: (error: unknown) => {
          errorRecibido = error;
        },
      });

      const peticion = httpMock.expectOne('/api/v1/test');
      peticion.flush({ mensaje: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceMock.cerrarSesion).toHaveBeenCalledTimes(1);
      expect(errorRecibido).toBeInstanceOf(HttpErrorResponse);
      expect((errorRecibido as HttpErrorResponse).status).toBe(401);
    });

    it('no debe cerrar sesión cuando una petición sin token responde 401', () => {
      let errorRecibido: unknown;

      httpClient.get('/api/v1/test').subscribe({
        next: () => expect.fail('no debía resolverse exitosamente'),
        error: (error: unknown) => {
          errorRecibido = error;
        },
      });

      const peticion = httpMock.expectOne('/api/v1/test');
      peticion.flush(
        { mensaje: 'Credenciales inválidas' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(authServiceMock.cerrarSesion).not.toHaveBeenCalled();
      expect(errorRecibido).toBeInstanceOf(HttpErrorResponse);
      expect((errorRecibido as HttpErrorResponse).status).toBe(401);
    });

    it('debe cerrar sesión cuando el token fue eliminado de localStorage pero la sesión sigue activa y responde 401', () => {
      authServiceMock.estaAutenticado.mockReturnValue(true);
      let errorRecibido: unknown;

      httpClient.get('/api/v1/test').subscribe({
        next: () => expect.fail('no debía resolverse exitosamente'),
        error: (error: unknown) => {
          errorRecibido = error;
        },
      });

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({ mensaje: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceMock.cerrarSesion).toHaveBeenCalledTimes(1);
      expect((errorRecibido as HttpErrorResponse).status).toBe(401);
    });

    it('no debe cerrar sesión cuando una petición con token responde 403', () => {
      const tokenPrueba = 'jwt.payload.firma';
      localStorage.setItem(TOKEN_KEY, tokenPrueba);
      let errorRecibido: unknown;

      httpClient.get('/api/v1/test').subscribe({
        next: () => expect.fail('no debía resolverse exitosamente'),
        error: (error: unknown) => {
          errorRecibido = error;
        },
      });

      const peticion = httpMock.expectOne('/api/v1/test');
      peticion.flush({ mensaje: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' });

      expect(authServiceMock.cerrarSesion).not.toHaveBeenCalled();
      expect(errorRecibido).toBeInstanceOf(HttpErrorResponse);
      expect((errorRecibido as HttpErrorResponse).status).toBe(403);
    });
  });

  describe('casos borde', () => {
    it('no debe agregar la cabecera si el token contiene solo espacios en blanco', () => {
      localStorage.setItem(TOKEN_KEY, '    ');

      httpClient.get('/api/v1/test').subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });

    it('no debe agregar la cabecera si el token es una cadena vacia', () => {
      localStorage.setItem(TOKEN_KEY, '');

      httpClient.get('/api/v1/test').subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });

    it('debe procesar peticiones con diferentes metodos HTTP de forma consistente', () => {
      const tokenPrueba = 'token-post';
      localStorage.setItem(TOKEN_KEY, tokenPrueba);

      httpClient.post('/api/v1/test', { dato: 123 }).subscribe();

      const peticion = httpMock.expectOne('/api/v1/test');
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${tokenPrueba}`);
      peticion.flush({});
    });
  });
});
