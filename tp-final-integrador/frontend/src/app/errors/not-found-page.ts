import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../auth/auth-service';
import { resolverAccionPrincipalError } from './error-action';
import { ErrorCard } from './error-card';

@Component({
  selector: 'app-not-found-page',
  imports: [Button, ErrorCard],
  template: `
    <main class="min-h-dvh flex flex-col justify-center items-center px-4 bg-slate-50">
      <app-error-card
        icono="pi-compass"
        codigo="404"
        titulo="Página no encontrada"
        mensaje="No pudimos encontrar la página que buscás. Puede que el enlace esté mal escrito o que el recurso ya no exista."
        mensajeSecundario="Verificá la dirección ingresada o utilizá los accesos directos de abajo."
        pie="Si llegaste acá desde un enlace de la clínica, comunicate con la administración."
        [accionPrincipal]="accionPrincipal()"
        [redirigiendo]="redirigiendo()"
        (accionPrincipalClick)="navegarPrincipal()"
      >
        @if (puedeVolverAtras()) {
          <p-button
            label="Volver atrás"
            icon="pi pi-arrow-left"
            [text]="true"
            styleClass="w-full min-h-12 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
            (onClick)="volverAtras()"
          />
        }
      </app-error-card>
    </main>
  `,
})
export class NotFoundPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly redirigiendo = signal(false);
  readonly puedeVolverAtras = signal(typeof window !== 'undefined' && window.history.length > 1);

  readonly accionPrincipal = computed(() => resolverAccionPrincipalError(this.auth.rol(), 'ir'));

  navegarPrincipal(): void {
    this.redirigiendo.set(true);
    this.router.navigateByUrl(this.accionPrincipal().ruta);
  }

  volverAtras(): void {
    this.location.back();
  }
}

export default NotFoundPage;
