import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

/**
 * Declara la política de acceso de un endpoint en un solo lugar:
 * autenticación (AuthGuard) siempre, autorización por rol (RolesGuard)
 * cuando se indican roles.
 *
 * El orden de los guards es significativo: AuthGuard debe ejecutarse
 * primero para poblar `request.user` antes de que RolesGuard lo lea.
 *
 * Uso:
 *   @Auth()                       // cualquier usuario autenticado
 *   @Auth(RolUsuario.MEDICO)      // autenticado + rol requerido
 */
export const Auth = (...roles: RolUsuario[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RolesGuard),
  );
