import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { obtenerRutaInicioPorRol } from '../auth';
import { AuthService } from '../auth/auth-service';

@Component({
  selector: 'app-not-found-page',
  imports: [Button],
  template: `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <span class="text-6xl font-extrabold text-teal-600 mb-2">404</span>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">Página no encontrada</h1>
      <p class="text-slate-600 max-w-md mb-6">La ruta solicitada no existe o fue movida.</p>
      <p-button label="Volver al inicio" icon="pi pi-arrow-left" (onClick)="volverAlInicio()" />
    </div>
  `,
})
export default class NotFoundPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  volverAlInicio(): void {
    const destino = obtenerRutaInicioPorRol(this.auth.rol());
    this.router.navigateByUrl(destino);
  }
}
