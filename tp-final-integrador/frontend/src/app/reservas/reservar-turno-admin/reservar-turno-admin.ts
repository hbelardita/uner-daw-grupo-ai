import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';
import { RUTAS } from '../../constantes/rutas';
import { BuscadorPaciente } from '../../pacientes/buscador-paciente/buscador-paciente';
import type { PacienteResumen } from '../../pacientes/paciente';
import { ResumenErrores } from '../../shared';
import { DocumentoPipe } from '../../shared/documento-pipe';
import { clasificarFalloHttp } from '../../shared/functions/fallo-http';
import { ComprobanteTurno } from '../comprobante-turno/comprobante-turno';
import {
  formatearRangoHorarioReserva,
  type PacienteComprobante,
  type ReservaConfirmadaVista,
} from '../regla-reserva';
import { ReservasService } from '../reservas-service';
import { SeleccionTurno, type SeleccionTurnoVista } from '../seleccion-turno/seleccion-turno';
import { TEXTOS_FALLO_RESERVA } from '../textos-fallo-reserva';

@Component({
  selector: 'app-reservar-turno-admin',
  imports: [
    BuscadorPaciente,
    Button,
    ComprobanteTurno,
    CurrencyPipe,
    DocumentoPipe,
    ResumenErrores,
    SeleccionTurno,
  ],
  templateUrl: './reservar-turno-admin.html',
})
class ReservarTurnoAdmin {
  private readonly reservasService = inject(ReservasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seleccionZona = viewChild(SeleccionTurno);

  readonly pacienteSeleccionado = signal<PacienteResumen | null>(null);
  readonly seleccionActiva = signal<SeleccionTurnoVista | null>(null);
  readonly confirmando = signal<boolean>(false);
  readonly errorConfirmacion = signal<string | null>(null);
  readonly reservaConfirmada = signal<ReservaConfirmadaVista | null>(null);

  readonly pacienteDelComprobante = computed<PacienteComprobante | null>(() =>
    this.pacienteSeleccionado(),
  );

  readonly habilitarSeleccion = computed<boolean>(
    () => this.pacienteSeleccionado() !== null && !this.confirmando(),
  );

  readonly puedeConfirmar = computed<boolean>(
    () =>
      this.pacienteSeleccionado() !== null &&
      this.seleccionActiva() !== null &&
      !this.confirmando(),
  );

  readonly motivoBloqueo = computed<string | null>(() => {
    if (this.confirmando()) {
      return null;
    }

    if (this.pacienteSeleccionado() === null) {
      return 'Seleccioná un paciente para confirmar la reserva.';
    }

    if (this.seleccionActiva() === null) {
      return 'Elegí profesional, fecha y horario para confirmar.';
    }

    return null;
  });

  alSeleccionar(seleccion: SeleccionTurnoVista | null): void {
    this.seleccionActiva.set(seleccion);

    if (seleccion) {
      this.errorConfirmacion.set(null);
    }
  }

  confirmarReserva(): void {
    const paciente = this.pacienteSeleccionado();
    const seleccion = this.seleccionActiva();

    if (!paciente || !seleccion || this.confirmando()) {
      return;
    }

    this.confirmando.set(true);
    this.errorConfirmacion.set(null);

    this.reservasService
      .crearReserva({
        idMedico: seleccion.medico.id,
        fechaHora: seleccion.fechaHoraIso,
        idPaciente: paciente.id,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.confirmando.set(false)),
      )
      .subscribe({
        next: (reserva) => {
          this.reservaConfirmada.set({
            reserva,
            medico: seleccion.medico,
            etiquetaFecha: seleccion.etiquetaFecha,
            rangoHorario: formatearRangoHorarioReserva(reserva.fechaHora),
          });
        },
        error: (error: unknown) => {
          const fallo = clasificarFalloHttp(error, TEXTOS_FALLO_RESERVA);
          this.errorConfirmacion.set(fallo.mensaje);

          if (fallo.requiereRecargar) {
            this.seleccionActiva.set(null);
            this.seleccionZona()?.recargarDisponibilidad();
          }
        },
      });
  }

  irATodosLosTurnos(): void {
    this.router.navigate([RUTAS.TURNOS_ADMIN]);
  }

  reiniciar(): void {
    this.reservaConfirmada.set(null);
    this.seleccionActiva.set(null);
    this.pacienteSeleccionado.set(null);
    this.errorConfirmacion.set(null);
    this.seleccionZona()?.reiniciar();
  }
}

export default ReservarTurnoAdmin;
