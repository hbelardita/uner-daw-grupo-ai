import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { AuthService } from '../../auth/auth-service';
import { UserBadge } from '../user-badge/user-badge';

export interface ItemNavegacion {
  etiqueta: string;
  ruta: string;
  icono: string;
  exacto?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Drawer, NgTemplateOutlet, UserBadge],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly abierto = input<boolean>(false);
  readonly esDesktop = signal<boolean>(false);
  readonly cerrar = output<void>();

  readonly itemsNavegacion = computed<ItemNavegacion[]>(() => {
    const rol = this.auth.rol();

    switch (rol) {
      case 'PACIENTE':
        return [
          { etiqueta: 'Mis turnos', ruta: '/mis-turnos', icono: 'pi pi-list' },
          { etiqueta: 'Reservar turno', ruta: '/turnos/nueva', icono: 'pi pi-plus' },
        ];
      case 'MEDICO':
        return [{ etiqueta: 'Mi agenda', ruta: '/agenda', icono: 'pi pi-calendar' }];
      case 'ADMINISTRADOR':
        return [
          {
            etiqueta: 'Turnos',
            ruta: '/turnos',
            icono: 'pi pi-table',
            exacto: true,
          },
          { etiqueta: 'Reservar turno', ruta: '/turnos/nueva', icono: 'pi pi-plus' },
          { etiqueta: 'Médicos y aranceles', ruta: '/gestion', icono: 'pi pi-wallet' },
        ];
      default:
        return [];
    }
  });

  constructor() {
    const mediaQuery = this.document.defaultView?.matchMedia('(min-width: 1024px)');

    if (!mediaQuery) return;

    this.esDesktop.set(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      this.esDesktop.set(event.matches);
      if (event.matches && this.abierto()) {
        this.cerrar.emit();
      }
    };

    mediaQuery.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => {
      mediaQuery.removeEventListener('change', listener);
    });
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cerrar.emit();
    }
  }

  onNavegacionClick(): void {
    this.cerrar.emit();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.cerrar.emit();
  }
}
