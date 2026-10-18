import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../auth/auth-service';
import { formatearDocumento, obtenerEtiquetaRol } from '../layout-navigation';

export type AlineacionUserBadge = 'left' | 'right';

@Component({
  selector: 'app-user-badge',
  imports: [],
  templateUrl: './user-badge.html',
})
export class UserBadge {
  private readonly auth = inject(AuthService);

  protected readonly alineacion = input<AlineacionUserBadge>('left');
  protected readonly mostrarDocumento = input<boolean>(false);

  protected readonly nombreUsuario = computed(() => this.auth.nombreCompleto() || 'Usuario');
  protected readonly etiquetaRol = computed(() => obtenerEtiquetaRol(this.auth.rol()));
  protected readonly documentoFormateado = computed(() =>
    formatearDocumento(this.auth.usuario()?.documento),
  );
}
