import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { obtenerRutaInicioPorRol } from '../auth/auth-navigation';
import { AuthService } from '../auth/auth-service';

@Component({
  selector: 'app-forbidden-page',
  imports: [Button],
  template: `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <span class="text-6xl font-extrabold text-amber-600 mb-2">403</span>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h1>
      <p class="text-slate-600 max-w-md mb-6">
        No cuenta con los permisos necesarios para acceder a esta sección de la clínica.
      </p>
      <p-button label="Ir a mi inicio" icon="pi pi-home" (onClick)="volverAlInicio()" />
    </div>
  `,
})
export default class ForbiddenPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  volverAlInicio(): void {
    const destino = obtenerRutaInicioPorRol(this.auth.rol());
    this.router.navigateByUrl(destino);
  }
}
