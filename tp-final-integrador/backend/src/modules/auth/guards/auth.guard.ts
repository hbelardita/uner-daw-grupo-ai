import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Token de sesión no proporcionado.');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de sesión no proporcionado.');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Token de sesión no proporcionado.');
    }

    const payload = await this.authService.verificarToken(token);
    request.user = payload;

    return true;
  }
}
