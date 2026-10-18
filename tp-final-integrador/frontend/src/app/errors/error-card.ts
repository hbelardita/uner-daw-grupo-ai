import { afterNextRender, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { Button } from 'primeng/button';
import type { AccionPrincipal } from './error-action';

@Component({
  selector: 'app-error-card',
  imports: [Button],
  template: `
    <div
      #contenedorAlerta
      role="alert"
      tabindex="-1"
      class="w-full max-w-120 bg-white rounded-2xl shadow-lg border border-slate-300 p-6 md:p-8 flex flex-col items-center text-center outline-none"
    >
      <div class="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center mb-4">
        <i [class]="'pi ' + icono()" class="text-primary text-2xl" aria-hidden="true"></i>
      </div>

      @if (codigo()) {
        <span class="text-4xl md:text-5xl font-extrabold font-heading text-primary tracking-tight">
          {{ codigo() }}
        </span>
      }

      <h1 class="text-xl md:text-2xl font-bold font-heading text-slate-900" [class.mt-1]="codigo()">
        {{ titulo() }}
      </h1>

      <p class="text-base text-slate-700 mt-3 max-w-sm">
        {{ mensaje() }}
      </p>
      <p class="text-xs md:text-sm text-slate-500 mt-1">
        {{ mensajeSecundario() }}
      </p>

      <div class="w-full flex flex-col gap-3 mt-6">
        <p-button
          styleClass="w-full min-h-12 rounded-lg font-medium bg-primary hover:bg-primary-hover"
          [label]="redirigiendo() ? 'Redirigiendo...' : accionPrincipal().label"
          [icon]="redirigiendo() ? undefined : accionPrincipal().icon"
          [loading]="redirigiendo()"
          (onClick)="accionPrincipalClick.emit()"
        />

        <ng-content />
      </div>

      <p class="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-200 w-full text-center">
        {{ pie() }}
      </p>
    </div>
  `,
})
export class ErrorCard {
  readonly icono = input.required<string>();
  readonly codigo = input<string>();
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly mensajeSecundario = input.required<string>();
  readonly pie = input.required<string>();
  readonly accionPrincipal = input.required<AccionPrincipal>();
  readonly redirigiendo = input(false);

  readonly accionPrincipalClick = output<void>();

  private readonly contenedorAlerta = viewChild<ElementRef<HTMLDivElement>>('contenedorAlerta');

  constructor() {
    afterNextRender(() => {
      this.contenedorAlerta()?.nativeElement.focus();
    });
  }
}
