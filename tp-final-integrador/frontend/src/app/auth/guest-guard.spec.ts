import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth-service';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
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
    it('debe permitir el acceso cuando el usuario no tiene sesión iniciada', () => {
      estaAutenticadoSignal.set(false);

      const resultado = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));

      expect(resultado).toBe(true);
    });
  });

  describe('errores esperados y restricciones', () => {
    it('debe bloquear el acceso y redirigir a la raíz / cuando ya hay sesión iniciada', () => {
      estaAutenticadoSignal.set(true);

      const resultado = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/');
    });
  });

  describe('casos borde', () => {
    it('debe permitir acceso si el usuario cierra su sesión y reintenta acceder', () => {
      estaAutenticadoSignal.set(true);
      const primerResultado = TestBed.runInInjectionContext(() =>
        guestGuard(dummyRoute, dummyState),
      );
      expect(primerResultado instanceof UrlTree).toBe(true);

      estaAutenticadoSignal.set(false);
      const segundoResultado = TestBed.runInInjectionContext(() =>
        guestGuard(dummyRoute, dummyState),
      );
      expect(segundoResultado).toBe(true);
    });
  });
});
