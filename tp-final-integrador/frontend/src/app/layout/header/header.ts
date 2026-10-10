import { Component, inject, output } from '@angular/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../auth/auth-service';
import { UserBadge } from '../user-badge/user-badge';

@Component({
  selector: 'app-header',
  imports: [Button, UserBadge],
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(AuthService);

  readonly toggleSidebar = output<void>();

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
