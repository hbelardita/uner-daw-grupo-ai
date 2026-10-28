import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { RUTAS } from '../constantes/rutas';
import { obtenerRutaInicioPorRol } from './auth-navigation';
import { AuthService } from './auth-service';
import type { RolUsuario } from './rol-usuario';

export function roleGuard(allowedRoles?: readonly RolUsuario[] | RolUsuario): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
      return router.createUrlTree([RUTAS.LOGIN]);
    }

    const rolActual = authService.rol();
    if (!rolActual) {
      return router.createUrlTree([RUTAS.LOGIN]);
    }

    const rolesPermitidos: readonly RolUsuario[] = Array.isArray(allowedRoles)
      ? allowedRoles
      : allowedRoles
        ? [allowedRoles]
        : [];

    if (rolesPermitidos.includes(rolActual)) {
      return true;
    }

    // Keep users in the section associated with their role when they try to
    // access a route that is not available to them.
    return router.parseUrl(obtenerRutaInicioPorRol(rolActual));
  };
}
