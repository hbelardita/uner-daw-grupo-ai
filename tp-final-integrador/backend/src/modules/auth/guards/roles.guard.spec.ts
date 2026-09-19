import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

class ControladorPrueba {
  @Roles(RolUsuario.MEDICO)
  soloMedico() {}

  @Roles(RolUsuario.MEDICO, RolUsuario.ADMINISTRADOR)
  medicoOAdmin() {}

  sinDecorador() {}

  @Roles()
  rolesVacio() {}
}

@Roles(RolUsuario.ADMINISTRADOR)
class ControladorAdmin {
  endpointHeredado() {}

  @Roles(RolUsuario.PACIENTE)
  overridePaciente() {}
}

function crearContexto(
  targetClass: new (...args: unknown[]) => unknown,
  handlerName: string,
  user?: unknown,
): ExecutionContext {
  const handler = (targetClass.prototype as Record<string, unknown>)[
    handlerName
  ];
  return {
    getClass: () => targetClass,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({ user }) as AuthenticatedRequest,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (Comportamiento de Autorización)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe('Casos de éxito', () => {
    it('debe permitir acceso cuando el usuario posee el rol requerido', () => {
      const ctx = crearContexto(ControladorPrueba, 'soloMedico', {
        rol: RolUsuario.MEDICO,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe permitir acceso cuando el rol del usuario coincide con uno de varios roles permitidos', () => {
      const ctx = crearContexto(ControladorPrueba, 'medicoOAdmin', {
        rol: RolUsuario.ADMINISTRADOR,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe permitir acceso cuando el endpoint no requiere roles específicos', () => {
      const ctx = crearContexto(ControladorPrueba, 'sinDecorador', {
        rol: RolUsuario.PACIENTE,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe permitir acceso si la lista de roles decorada está vacía', () => {
      const ctx = crearContexto(ControladorPrueba, 'rolesVacio', {
        rol: RolUsuario.PACIENTE,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe permitir acceso cuando la clase define el rol permitido', () => {
      const ctx = crearContexto(ControladorAdmin, 'endpointHeredado', {
        rol: RolUsuario.ADMINISTRADOR,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe priorizar el rol especificado a nivel de método sobre el de la clase', () => {
      const ctx = crearContexto(ControladorAdmin, 'overridePaciente', {
        rol: RolUsuario.PACIENTE,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Errores esperados', () => {
    it('debe retornar false cuando el usuario tiene un rol no autorizado', () => {
      const ctx = crearContexto(ControladorPrueba, 'soloMedico', {
        rol: RolUsuario.PACIENTE,
      });
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('debe retornar false cuando no hay usuario autenticado en la solicitud', () => {
      const ctx = crearContexto(ControladorPrueba, 'soloMedico', undefined);
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('debe retornar false si el método sobreescribe la clase y el usuario no cumple el rol del método', () => {
      const ctx = crearContexto(ControladorAdmin, 'overridePaciente', {
        rol: RolUsuario.ADMINISTRADOR,
      });
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('Casos borde', () => {
    it.each([
      { rol: RolUsuario.MEDICO, esperado: true },
      { rol: RolUsuario.PACIENTE, esperado: false },
      { rol: RolUsuario.ADMINISTRADOR, esperado: false },
    ])(
      'debe retornar $esperado para el rol $rol al verificar endpoint soloMedico',
      ({ rol, esperado }) => {
        const ctx = crearContexto(ControladorPrueba, 'soloMedico', { rol });
        expect(guard.canActivate(ctx)).toBe(esperado);
      },
    );
  });
});
