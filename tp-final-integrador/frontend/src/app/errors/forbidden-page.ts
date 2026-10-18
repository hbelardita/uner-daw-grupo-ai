import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../auth/auth-service';
import { resolverAccionPrincipalError } from './error-action';
import { ErrorCard } from './error-card';

@Component({
  selector: 'app-forbidden-page',
  imports: [Button, ErrorCard],
  template: `
    <section class="min-h-[60dvh] flex flex-col justify-center items-center px-4 py-8">
      <app-error-card
        icono="pi-lock"
        titulo="Acceso no permitido"
        mensaje="Tu usuario no tiene permisos para acceder a esta sección."
        mensajeSecundario="Si creés que esto es un error, comunicate con la administración de la clínica."
        pie="¿Necesitás otro nivel de acceso? Contactá a la administración."
        [accionPrincipal]="accionPrincipal()"
        [redirigiendo]="redirigiendo()"
        (accionPrincipalClick)="navegarPrincipal()"
      >
        <p-button
          label="Cerrar sesión"
          icon="pi pi-sign-out"
          [text]="true"
          styleClass="w-full min-h-12 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
          (onClick)="cerrarSesion()"
        />
      </app-error-card>
    </section>
  `,
})
export class ForbiddenPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly redirigiendo = signal(false);

  readonly accionPrincipal = computed(() =>
    resolverAccionPrincipalError(this.auth.rol(), 'volver'),
  );

  navegarPrincipal(): void {
    this.redirigiendo.set(true);
    void this.router.navigateByUrl(this.accionPrincipal().ruta);
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}

export default ForbiddenPage;
