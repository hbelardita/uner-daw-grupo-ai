import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../app.config';
import type { LoginResponse, Usuario } from './auth-dto';
import {
  AuthService,
  decodeJwtPayload,
  obtenerRutaInicioPorRol,
  RUTA_INICIO_POR_ROL,
  TOKEN_KEY,
} from './auth-service';
import type { RolUsuario } from './rol-usuario';

function crearTokenPrueba(payload: object): string {
  const encabezado = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = btoa(JSON.stringify(payload));
  return `${encabezado}.${cuerpo}.firma_falsa`;
}

describe('AuthService y utilidades de autenticación', () => {
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: baseUrl,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  const crearServicio = (): AuthService => TestBed.inject(AuthService);

  describe('funciones puras auxiliares', () => {
    describe('obtenerRutaInicioPorRol', () => {
      it('debe devolver la ruta de turnos para el rol PACIENTE', () => {
        expect(obtenerRutaInicioPorRol('PACIENTE')).toBe(RUTA_INICIO_POR_ROL.PACIENTE);
      });

      it('debe devolver la ruta de agenda para el rol MEDICO', () => {
        expect(obtenerRutaInicioPorRol('MEDICO')).toBe(RUTA_INICIO_POR_ROL.MEDICO);
      });

      it('debe devolver la ruta de turnos administrativos para ADMINISTRADOR', () => {
        expect(obtenerRutaInicioPorRol('ADMINISTRADOR')).toBe(RUTA_INICIO_POR_ROL.ADMINISTRADOR);
      });

      it('debe retornar /login para roles nulos, indefinidos o no reconocidos', () => {
        expect(obtenerRutaInicioPorRol(null)).toBe('/login');
        expect(obtenerRutaInicioPorRol(undefined)).toBe('/login');
        expect(obtenerRutaInicioPorRol('ROL_INEXISTENTE' as unknown as RolUsuario)).toBe('/login');
      });
    });

    describe('decodeJwtPayload', () => {
      it('debe decodificar un token JWT valido y extraer sus datos', () => {
        const token = crearTokenPrueba({ sub: 15, rol: 'MEDICO', idMedico: 3 });
        const resultado = decodeJwtPayload(token);

        expect(resultado).not.toBeNull();
        expect(resultado?.sub).toBe(15);
        expect(resultado?.rol).toBe('MEDICO');
        expect(resultado?.idMedico).toBe(3);
      });

      it('debe retornar null ante tokens invalidos, vacios o malformados', () => {
        expect(decodeJwtPayload('')).toBeNull();
        expect(decodeJwtPayload('token_sin_puntos')).toBeNull();
        expect(decodeJwtPayload('encabezado.cuerpo_invalido_!@#$.firma')).toBeNull();
      });
    });
  });

  describe('casos de éxito de AuthService', () => {
    it('debe iniciar sesión, guardar el token en localStorage y cargar el perfil', () => {
      const service = crearServicio();
      const token = crearTokenPrueba({ sub: 10, rol: 'PACIENTE' });
      const loginRespuesta: LoginResponse = { token };
      const usuarioRespuesta: Usuario = {
        id: 10,
        documento: '12345678',
        apellidos: 'Perez',
        nombres: 'Juan',
        email: 'juan.perez@test.com',
        rol: 'PACIENTE',
        estado: 'ACTIVO',
      };

      service.iniciarSesion('12345678', 'clave123').subscribe((res) => {
        expect(res.token).toBe(token);
      });

      const peticionLogin = httpMock.expectOne(`${baseUrl}/auth/login`);
      expect(peticionLogin.request.method).toBe('POST');
      expect(peticionLogin.request.body).toEqual({ documento: '12345678', clave: 'clave123' });
      peticionLogin.flush(loginRespuesta);

      const peticionMe = httpMock.expectOne(`${baseUrl}/auth/me`);
      expect(peticionMe.request.method).toBe('GET');
      peticionMe.flush(usuarioRespuesta);

      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(service.estaAutenticado()).toBe(true);
      expect(service.tokenSignal()).toBe(token);
      expect(service.usuario()).toEqual(usuarioRespuesta);
      expect(service.rol()).toBe('PACIENTE');
      expect(service.nombreCompleto()).toBe('Juan Perez');
      expect(service.medico()).toBeUndefined();
    });

    it('debe obtener el perfil de médico con datos médicos anidados', () => {
      const service = crearServicio();
      const usuarioMedico: Usuario = {
        id: 5,
        documento: '20111222',
        apellidos: 'Gomez',
        nombres: 'Laura',
        email: 'laura.gomez@test.com',
        rol: 'MEDICO',
        estado: 'ACTIVO',
        medico: {
          id: 1,
          matricula: 5432,
          valorConsulta: 12000,
        },
      };

      service.obtenerPerfil().subscribe((perfil) => {
        expect(perfil).toEqual(usuarioMedico);
      });

      const peticion = httpMock.expectOne(`${baseUrl}/auth/me`);
      peticion.flush(usuarioMedico);

      expect(service.usuario()).toEqual(usuarioMedico);
      expect(service.rol()).toBe('MEDICO');
      expect(service.medico()).toEqual({ id: 1, matricula: 5432, valorConsulta: 12000 });
      expect(service.nombreCompleto()).toBe('Laura Gomez');
    });

    it('debe limpiar todo el estado y localStorage al invocar cerrarSesion', () => {
      const token = crearTokenPrueba({ sub: 1, rol: 'PACIENTE' });
      localStorage.setItem(TOKEN_KEY, token);
      const service = crearServicio();

      service.cerrarSesion();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.estaAutenticado()).toBe(false);
      expect(service.tokenSignal()).toBeNull();
      expect(service.usuario()).toBeNull();
      expect(service.rol()).toBeNull();
      expect(service.nombreCompleto()).toBe('');
    });
  });

  describe('errores esperados y manejo de sesión expirada', () => {
    it('debe purgar la sesión cuando cargarUsuarioActual recibe error 401 Unauthorized', () => {
      const token = crearTokenPrueba({ sub: 99, rol: 'PACIENTE' });
      localStorage.setItem(TOKEN_KEY, token);
      const service = crearServicio();

      service.cargarUsuarioActual().subscribe((res) => {
        expect(res).toBeNull();
      });

      const peticion = httpMock.expectOne(`${baseUrl}/auth/me`);
      peticion.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.estaAutenticado()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('debe purgar la sesión cuando cargarUsuarioActual recibe error 403 Forbidden', () => {
      const token = crearTokenPrueba({ sub: 99, rol: 'PACIENTE' });
      localStorage.setItem(TOKEN_KEY, token);
      const service = crearServicio();

      service.cargarUsuarioActual().subscribe((res) => {
        expect(res).toBeNull();
      });

      const peticion = httpMock.expectOne(`${baseUrl}/auth/me`);
      peticion.flush({ message: 'Acceso prohibido' }, { status: 403, statusText: 'Forbidden' });

      expect(service.estaAutenticado()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('casos borde', () => {
    it('debe retornar of(null) sin realizar peticiones si no hay token al invocar cargarUsuarioActual', () => {
      const service = crearServicio();
      service.cargarUsuarioActual().subscribe((res) => {
        expect(res).toBeNull();
      });

      httpMock.expectNone(`${baseUrl}/auth/me`);
    });

    it('debe calcular el rol desde el token cuando el perfil de usuario aun no fue cargado', () => {
      const token = crearTokenPrueba({ sub: 3, rol: 'ADMINISTRADOR' });
      localStorage.setItem(TOKEN_KEY, token);

      const service = crearServicio();
      expect(service.rol()).toBe('ADMINISTRADOR');
    });

    it('debe manejar errores no 401/403 en cargarUsuarioActual retornando null sin cerrar sesión', () => {
      const token = crearTokenPrueba({ sub: 88, rol: 'MEDICO' });
      localStorage.setItem(TOKEN_KEY, token);
      const service = crearServicio();

      service.cargarUsuarioActual().subscribe((res) => {
        expect(res).toBeNull();
      });

      const peticion = httpMock.expectOne(`${baseUrl}/auth/me`);
      peticion.flush(new ProgressEvent('error'), {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(service.estaAutenticado()).toBe(true);
      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    });
  });
});
