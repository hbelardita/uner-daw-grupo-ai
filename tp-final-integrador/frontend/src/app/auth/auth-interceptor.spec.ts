import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { TOKEN_KEY } from './token-storage';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
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
