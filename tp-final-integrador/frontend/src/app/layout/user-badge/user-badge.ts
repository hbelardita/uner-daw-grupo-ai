import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../auth/auth-service';

export type TemaUserBadge = 'light' | 'dark';
export type AlineacionUserBadge = 'left' | 'right';

@Component({
  selector: 'app-user-badge',
  imports: [Tag],
  templateUrl: './user-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserBadge {
  private readonly auth = inject(AuthService);

  readonly tema = input<TemaUserBadge>('light');
  readonly alineacion = input<AlineacionUserBadge>('left');

  protected readonly nombreUsuario = computed(() => this.auth.nombreCompleto() || 'Usuario');
  protected readonly rolUsuario = this.auth.rol;
}
