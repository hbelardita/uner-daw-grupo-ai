import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './private-layout.html',
})
export default class PrivateLayout {
  readonly sidebarAbierto = signal(false);

  alternarSidebar(): void {
    this.sidebarAbierto.update((actual) => !actual);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }
}
