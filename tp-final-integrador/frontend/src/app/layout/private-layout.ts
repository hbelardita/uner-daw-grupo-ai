import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { BottomNav } from './bottom-nav/bottom-nav';
import { Header } from './header/header';
import { obtenerItemsNavegacion } from './layout-navigation';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './private-layout.html',
})
export default class PrivateLayout {
  private readonly auth = inject(AuthService);

  protected readonly itemsNavegacion = computed(() => obtenerItemsNavegacion(this.auth.rol()));

  protected readonly mostrarBarraInferior = computed(() => this.itemsNavegacion().length > 1);
}
