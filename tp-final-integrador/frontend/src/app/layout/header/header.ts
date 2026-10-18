import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from 'primeng/button';
import { obtenerRutaInicioPorRol } from '../../auth/auth-navigation';
import { AuthService } from '../../auth/auth-service';
import { obtenerInicialesUsuario } from '../../shared/functions/utils';
import { obtenerItemsNavegacion } from '../layout-navigation';
import { UserBadge } from '../user-badge/user-badge';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Button, UserBadge],
  templateUrl: './header.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'cerrarMenuUsuario()',
  },
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly menuUsuarioAbierto = signal(false);

  protected readonly itemsNavegacion = computed(() => obtenerItemsNavegacion(this.auth.rol()));

  protected readonly rutaInicio = computed(() => obtenerRutaInicioPorRol(this.auth.rol()));

  protected readonly inicialesUsuario = computed(() => {
    const usuario = this.auth.usuario();
    return obtenerInicialesUsuario(usuario?.nombres, usuario?.apellidos);
  });

  protected readonly nombreCompleto = computed(() => this.auth.nombreCompleto() || 'Usuario');

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  cerrarMenuUsuario(): void {
    if (this.menuUsuarioAbierto()) {
      this.menuUsuarioAbierto.set(false);
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuUsuarioAbierto()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.menuUsuarioAbierto.set(false);
    }
  }

  protected cerrarSesion(): void {
    this.cerrarMenuUsuario();
    this.auth.cerrarSesion();
  }
}
