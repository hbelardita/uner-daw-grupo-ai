import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import type { Reserva } from '../../reservas/reserva';
import { formatearFechaHoraTurno } from '../functions/utils';

@Component({
  selector: 'app-cancelar-turno-dialog',
  imports: [Button, Dialog, Drawer, NgTemplateOutlet],
  templateUrl: './cancelar-turno-dialog.html',
})
export class CancelarTurnoDialog implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly reserva = input<Reserva | null>(null);
  readonly visible = model<boolean>(false);
  readonly cancelando = input<boolean>(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  protected readonly esMobile = signal<boolean>(false);

  readonly fechaHoraFormateada = computed(() => {
    const fecha = this.reserva()?.fechaHora;
    return fecha ? formatearFechaHoraTurno(fecha) : '';
  });

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

  cerrar(): void {
    if (this.cancelando()) {
      return;
    }
    this.visible.set(false);
    this.cancelar.emit();
  }

  onConfirmar(): void {
    if (this.cancelando()) {
      return;
    }
    this.confirmar.emit();
  }
}
