import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return requiredRoles.some((role) => user?.rol === role);
  }
}
