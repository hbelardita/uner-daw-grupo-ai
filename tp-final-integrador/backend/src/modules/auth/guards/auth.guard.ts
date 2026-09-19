import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    const payload = await this.authService.verificarToken(token);
    request.user = payload;

    return true;
  }
  private extractToken(request: AuthenticatedRequest): string | undefined {
    const [type, token] =
      request.headers.authorization?.trim().split(/\s+/) ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
