import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import { InputNumber } from 'primeng/inputnumber';
import { Message } from 'primeng/message';
import { ResumenErrores } from '../../shared/resumen-errores/resumen-errores';
import type { MedicoListItem } from '../medico';

@Component({
  selector: 'app-modificar-arancel-dialog',
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    Button,
    Dialog,
    Drawer,
    InputNumber,
    Message,
    ResumenErrores,
  ],
  templateUrl: './modificar-arancel-dialog.html',
})
export class ModificarArancelDialog implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly medico = input<MedicoListItem | null>(null);
  readonly visible = model<boolean>(false);
  readonly guardando = input<boolean>(false);
  readonly errorServidor = input<string | null>(null);

  readonly confirmar = output<number>();
  readonly cancelar = output<void>();

  protected readonly esMobile = signal<boolean>(false);

  readonly mensajeErrorValidacion =
    'El valor de consulta debe ser un importe numérico entero positivo.';

  readonly formulario = new FormGroup({
    valorConsulta: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)],
    }),
  });

  constructor() {
    effect(() => {
      const med = this.medico();
      const estaVisible = this.visible();

      if (estaVisible && med) {
        this.formulario.controls.valorConsulta.setValue(med.valorConsulta, { emitEvent: false });
        this.formulario.markAsPristine();
        this.formulario.markAsUntouched();
      }
    });

    effect(() => {
      if (this.guardando()) {
        this.formulario.disable({ emitEvent: false });
      } else {
        this.formulario.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const mediaQuery = window.matchMedia('(max-width: 767.98px)');
    this.esMobile.set(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      this.esMobile.set(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => {
      mediaQuery.removeEventListener('change', handler);
    });
  }

  esInvalido(): boolean {
    const control = this.formulario.controls.valorConsulta;
    return control.invalid && (control.touched || control.dirty);
  }

  cerrar(): void {
    if (this.guardando()) {
      return;
    }
    this.visible.set(false);
    this.cancelar.emit();
  }

  enviar(): void {
    if (this.guardando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.controls.valorConsulta.getRawValue();
    if (valor !== null) {
      this.confirmar.emit(valor);
    }
  }
}
