import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { DocumentoPipe } from '../../shared/documento-pipe';
import {
  construirComprobanteTurno,
  type PacienteComprobante,
  type ComprobanteTurnoVista,
  type ReservaConfirmadaVista,
} from '../regla-reserva';

@Component({
  selector: 'app-comprobante-turno',
  imports: [Button, CurrencyPipe, Dialog, DocumentoPipe, Message],
  templateUrl: './comprobante-turno.html',
})
export class ComprobanteTurno {
  readonly reserva = input<ReservaConfirmadaVista | null>(null);
  readonly paciente = input<PacienteComprobante | null>(null);
  readonly etiquetaVerTurnos = input<string>('Ver mis turnos');

  readonly verMisTurnos = output<void>();
  readonly nuevaReserva = output<void>();

  readonly comprobante = computed<ComprobanteTurnoVista | null>(() => {
    const reserva = this.reserva();

    if (!reserva) {
      return null;
    }

    return construirComprobanteTurno(reserva, this.paciente());
  });
}
