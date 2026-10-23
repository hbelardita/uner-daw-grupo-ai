import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';
import { CurrentUser } from '../../auth/current-user';
import { RUTAS } from '../../constantes/rutas';
import { ResumenErrores } from '../../shared';
import { clasificarFalloHttp } from '../../shared/functions/fallo-http';
import { ComprobanteTurno } from '../comprobante-turno/comprobante-turno';
import {
  formatearRangoHorarioReserva,
  type PacienteComprobante,
  type ReservaConfirmadaVista,
} from '../regla-reserva';
import { ReservasService } from '../reservas-service';
import { TEXTOS_FALLO_RESERVA } from '../textos-fallo-reserva';
import { SeleccionTurno, type SeleccionTurnoVista } from '../seleccion-turno/seleccion-turno';

@Component({
  selector: 'app-reservar-turno',
  imports: [Button, ComprobanteTurno, CurrencyPipe, ResumenErrores, SeleccionTurno],
  templateUrl: './reservar-turno.html',
})
class ReservarTurno {
  private readonly reservasService = inject(ReservasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUser = inject(CurrentUser);

  private readonly seleccionZona = viewChild(SeleccionTurno);

  readonly seleccionActiva = signal<SeleccionTurnoVista | null>(null);
  readonly confirmando = signal<boolean>(false);
  readonly errorConfirmacion = signal<string | null>(null);
  readonly reservaConfirmada = signal<ReservaConfirmadaVista | null>(null);

  readonly pacienteDelComprobante = computed<PacienteComprobante | null>(() => {
    const usuario = this.currentUser.usuario();
    if (!usuario) {
      return null;
    }
    return {
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      documento: usuario.documento,
    };
  });

  readonly puedeConfirmar = computed<boolean>(
    () => this.seleccionActiva() !== null && !this.confirmando(),
  );

  alSeleccionar(seleccion: SeleccionTurnoVista | null): void {
    this.seleccionActiva.set(seleccion);

    if (seleccion) {
      this.errorConfirmacion.set(null);
    }
  }

  confirmarReserva(): void {
    const seleccion = this.seleccionActiva();
    if (!seleccion || this.confirmando()) {
      return;
    }

    this.confirmando.set(true);
    this.errorConfirmacion.set(null);

    this.reservasService
      .crearReserva({
        idMedico: seleccion.medico.id,
        fechaHora: seleccion.fechaHoraIso,
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

  irAMisTurnos(): void {
    this.router.navigate([RUTAS.MIS_TURNOS]);
  }

  reiniciar(): void {
    this.reservaConfirmada.set(null);
    this.seleccionActiva.set(null);
    this.errorConfirmacion.set(null);
    this.seleccionZona()?.reiniciar();
  }
}

export default ReservarTurno;
