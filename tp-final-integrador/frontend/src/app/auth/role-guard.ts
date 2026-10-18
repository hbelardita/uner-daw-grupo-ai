import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth-service';
import { obtenerRutaInicioPorRol } from './auth-navigation';
import type { RolUsuario } from './rol-usuario';

export function roleGuard(allowedRoles?: readonly RolUsuario[] | RolUsuario): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
      return router.createUrlTree(['/login']);
    }

    const rolActual = authService.rol();
    const rolesPermitidos: readonly RolUsuario[] = Array.isArray(allowedRoles)
      ? allowedRoles
      : allowedRoles
        ? [allowedRoles]
        : [];

    if (rolActual && rolesPermitidos.includes(rolActual)) {
      return true;
    }

    const rutaDestino = obtenerRutaInicioPorRol(rolActual);
    return router.createUrlTree([rutaDestino]);
  };
}
