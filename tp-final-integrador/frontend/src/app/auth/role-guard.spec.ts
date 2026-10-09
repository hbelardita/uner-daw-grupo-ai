import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth-service';
import type { RolUsuario } from './rol-usuario';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  let estaAutenticadoSignal: WritableSignal<boolean>;
  let rolSignal: WritableSignal<RolUsuario | null>;

  const mockAuthService = {
    get estaAutenticado() {
      return estaAutenticadoSignal;
    },
    get rol() {
      return rolSignal;
    },
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    estaAutenticadoSignal = signal(true);
    rolSignal = signal<RolUsuario | null>(null);

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
    it('debe permitir el acceso cuando el rol del usuario coincide exactamente con el rol requerido', () => {
      rolSignal.set('PACIENTE');
      const guard = roleGuard(['PACIENTE']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado).toBe(true);
    });

    it('debe permitir el acceso cuando se pasa un solo rol como valor no empaquetado en arreglo', () => {
      rolSignal.set('MEDICO');
      const guard = roleGuard('MEDICO');

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado).toBe(true);
    });

    it('debe permitir el acceso si el rol del usuario está dentro de múltiples roles permitidos', () => {
      rolSignal.set('ADMINISTRADOR');
      const guard = roleGuard(['PACIENTE', 'ADMINISTRADOR']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado).toBe(true);
    });
  });

  describe('errores esperados y redirección por jerarquía de roles', () => {
    it('debe redirigir a /login si el usuario no tiene sesión iniciada', () => {
      estaAutenticadoSignal.set(false);
      rolSignal.set('PACIENTE');
      const guard = roleGuard(['PACIENTE']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/login');
    });

    it('debe redirigir a /agenda si un médico intenta ingresar a una ruta de paciente', () => {
      rolSignal.set('MEDICO');
      const guard = roleGuard(['PACIENTE']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/agenda');
    });

    it('debe redirigir a /mis-turnos si un paciente intenta ingresar a una ruta de administrador', () => {
      rolSignal.set('PACIENTE');
      const guard = roleGuard(['ADMINISTRADOR']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/mis-turnos');
    });

    it('debe redirigir a /turnos si un administrador intenta ingresar a una ruta de médico', () => {
      rolSignal.set('ADMINISTRADOR');
      const guard = roleGuard(['MEDICO']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/turnos');
    });
  });

  describe('casos borde', () => {
    it('debe redirigir a /login si el rol es nulo a pesar de figurar como autenticado', () => {
      rolSignal.set(null);
      const guard = roleGuard(['PACIENTE']);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/login');
    });

    it('debe redirigir a la ruta por rol del usuario si la lista de roles permitidos está vacía', () => {
      rolSignal.set('PACIENTE');
      const guard = roleGuard([]);

      const resultado = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(resultado instanceof UrlTree).toBe(true);
      expect((resultado as UrlTree).toString()).toBe('/mis-turnos');
    });
  });
});
