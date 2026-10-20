import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { CurrentUser } from '../../auth/current-user';
import { DocumentoPipe } from '../../shared/documento-pipe';
import {
  construirComprobanteTurno,
  type ComprobanteTurnoVista,
  type ReservaConfirmadaVista,
} from '../regla-reserva';

@Component({
  selector: 'app-comprobante-turno',
  imports: [Button, CurrencyPipe, Dialog, DocumentoPipe, Message],
  templateUrl: './comprobante-turno.html',
})
export class ComprobanteTurno {
  private readonly currentUser = inject(CurrentUser);

  readonly reserva = input<ReservaConfirmadaVista | null>(null);

  readonly verMisTurnos = output<void>();
  readonly nuevaReserva = output<void>();

  readonly comprobante = computed<ComprobanteTurnoVista | null>(() => {
    const reserva = this.reserva();

    if (!reserva) {
      return null;
    }

    const usuario = this.currentUser.usuario();
    const paciente = usuario
      ? {
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          documento: usuario.documento,
        }
      : null;

    return construirComprobanteTurno(reserva, paciente);
  });
}
