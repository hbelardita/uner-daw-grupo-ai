import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth-guard';
import { AuthService } from './auth-service';

describe('authGuard', () => {
  let estaAutenticadoSignal: WritableSignal<boolean>;

  const mockAuthService = {
    get estaAutenticado() {
      return estaAutenticadoSignal;
    },
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    estaAutenticadoSignal = signal(false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    });
  });

  describe('casos de éxito', () => {
    it('debe permitir la navegación cuando el usuario está autenticado', () => {
      estaAutenticadoSignal.set(true);

      const resultado = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(resultado).toBe(true);
    });
  });

  describe('errores esperados y restricciones', () => {
    it('debe bloquear la navegación y redirigir a /login cuando no está autenticado', () => {
      estaAutenticadoSignal.set(false);

      const resultado = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/login');
    });
  });

  describe('casos borde', () => {
    it('debe responder dinámicamente si la sesión se invalida en caliente', () => {
      estaAutenticadoSignal.set(true);
      const primerResultado = TestBed.runInInjectionContext(() =>
        authGuard(dummyRoute, dummyState),
      );
      expect(primerResultado).toBe(true);

      estaAutenticadoSignal.set(false);
      const segundoResultado = TestBed.runInInjectionContext(() =>
        authGuard(dummyRoute, dummyState),
      );
      expect(segundoResultado instanceof UrlTree).toBe(true);
      expect((segundoResultado as UrlTree).toString()).toBe('/login');
    });
  });
});
