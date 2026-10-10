import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}
