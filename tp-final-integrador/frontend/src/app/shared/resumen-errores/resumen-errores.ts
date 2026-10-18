import { Component, ElementRef, afterRenderEffect, input, viewChild } from '@angular/core';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-resumen-errores',
  imports: [Message],
  template: `@if (mensaje()) {
    <div #contenedorAlerta role="alert" tabindex="-1" class="outline-none">
      <p-message severity="error" styleClass="w-full">
        {{ mensaje() }}
      </p-message>
    </div>
  } `,
})
export class ResumenErrores {
  readonly mensaje = input<string | null>();

  private readonly contenedorAlerta = viewChild<ElementRef<HTMLDivElement>>('contenedorAlerta');

  constructor() {
    afterRenderEffect({
      write: () => {
        if (this.mensaje()) {
          console.log(this.mensaje());
          this.contenedorAlerta()?.nativeElement.focus();
        }
      },
    });
  }
}
