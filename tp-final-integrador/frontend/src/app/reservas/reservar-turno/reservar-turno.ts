import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, type Params } from '@angular/router';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { finalize } from 'rxjs';
import { RUTAS } from '../../constantes/rutas';
import type { DisponibilidadSlot, MedicoListItem } from '../../medicos/medico';
import { MedicosService } from '../../medicos/medicos-service';
import { EmptyState, FranjasHorariasGrid, ResumenErrores, SelectorFecha } from '../../shared';
import { clasificarFalloHttp, type TextosFalloHttp } from '../../shared/functions/fallo-http';
import { obtenerFechaLocalIso } from '../../shared/functions/fecha-clinica';
import { ComprobanteTurno } from '../comprobante-turno/comprobante-turno';
import {
  construirDiaReservable,
  esFechaReservableValida,
  formatearRangoHorarioReserva,
  obtenerRangoFechasReserva,
  type DiaReservable,
  type RangoFechasReserva,
  type ReservaConfirmadaVista,
  type ResumenReservaActiva,
} from '../regla-reserva';
import { ReservasService } from '../reservas-service';

const TEXTO_ERROR_MEDICOS = 'No pudimos cargar los profesionales. Por favor, reintentá.';
const TEXTO_ERROR_DISPONIBILIDAD = 'No pudimos cargar la disponibilidad. Por favor, reintentá.';

const TEXTOS_FALLO_RESERVA: TextosFalloHttp = {
  desincronizado:
    'Ese horario acaba de ser reservado por otra persona. Actualizamos la disponibilidad para que elijas otro.',
  sinPermiso: 'No tenes permiso para reservar turnos.',
  generico: 'No pudimos confirmar la reserva. Por favor, reintentá.',
};

@Component({
  selector: 'app-reservar-turno',
  imports: [
    CurrencyPipe,
    FormsModule,
    Button,
    Skeleton,
    ComprobanteTurno,
    EmptyState,
    FranjasHorariasGrid,
    ResumenErrores,
    SelectorFecha,
  ],
  templateUrl: './reservar-turno.html',
})
class ReservarTurno implements OnInit {
  private readonly medicosService = inject(MedicosService);
  private readonly reservasService = inject(ReservasService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly medico = input<string | undefined>(undefined);
  readonly fecha = input<string | undefined>(undefined);

  /**
   * Secuencia de la última solicitud de disponibilidad emitida.
   * Permite descartar respuestas que llegan fuera de orden .
   */
  private secuenciaDisponibilidad = 0;

  constructor() {
    effect(() => {
      const medicoParam = this.medico();
      const fechaParam = this.fecha();
      const medicos = this.medicos();

      let cambio = false;
      if (fechaParam) {
        const diaExistente = this.rangoFechas().diasHabiles.find((d) => d.fechaIso === fechaParam);
        const diaValido =
          diaExistente ??
          (esFechaReservableValida(fechaParam) ? construirDiaReservable(fechaParam) : null);
        if (diaValido && this.fechaSeleccionada()?.fechaIso !== diaValido.fechaIso) {
          this.fechaSeleccionada.set(diaValido);
          this.franjaSeleccionada.set(null);
          cambio = true;
        }
      }

      if (medicoParam && medicos.length > 0) {
        const id = Number.parseInt(medicoParam, 10);
        if (Number.isInteger(id)) {
          const medicoEncontrado = medicos.find((m) => m.id === id);
          if (medicoEncontrado && this.medicoSeleccionado()?.id !== medicoEncontrado.id) {
            this.medicoSeleccionado.set(medicoEncontrado);
            this.franjaSeleccionada.set(null);
            cambio = true;
          }
        }
      }

      if (cambio && this.medicoSeleccionado() && this.fechaSeleccionada()) {
        this.cargarDisponibilidad();
      }
    });
  }

  readonly medicos = signal<MedicoListItem[]>([]);
  readonly cargandoMedicos = signal<boolean>(true);
  readonly errorMedicos = signal<string | null>(null);
  readonly medicoSeleccionado = signal<MedicoListItem | null>(null);

  readonly rangoFechas = signal<RangoFechasReserva>(obtenerRangoFechasReserva());
  readonly fechaSeleccionada = signal<DiaReservable | null>(
    this.rangoFechas().diasHabiles[0] ?? null,
  );

  readonly slots = signal<readonly DisponibilidadSlot[]>([]);
  readonly cargandoSlots = signal<boolean>(false);
  readonly errorSlots = signal<string | null>(null);
  readonly franjaSeleccionada = signal<string | null>(null);

  readonly confirmando = signal<boolean>(false);
  readonly errorConfirmacion = signal<string | null>(null);
  readonly reservaConfirmada = signal<ReservaConfirmadaVista | null>(null);

  readonly fechaMinima = computed<Date>(() => this.rangoFechas().fechaMinima);
  readonly fechaMaxima = computed<Date>(() => this.rangoFechas().fechaMaxima);
  readonly fechaSeleccionadaDate = computed<Date>(
    () => this.fechaSeleccionada()?.fechaDate ?? this.rangoFechas().fechaMinima,
  );

  readonly resumen = computed<ResumenReservaActiva | null>(() => {
    const medico = this.medicoSeleccionado();
    const dia = this.fechaSeleccionada();
    const franja = this.franjaSeleccionada();

    if (!medico || !dia || !franja) {
      return null;
    }

    return {
      medico,
      dia,
      fechaHoraIso: franja,
      rangoHorario: formatearRangoHorarioReserva(franja),
      valorConsulta: medico.valorConsulta,
    };
  });

  readonly puedeConfirmar = computed<boolean>(() => this.resumen() !== null && !this.confirmando());

  ngOnInit(): void {
    this.cargarMedicos();
  }

  cargarMedicos(): void {
    this.cargandoMedicos.set(true);
    this.errorMedicos.set(null);
    this.medicosService
      .obtenerMedicos()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoMedicos.set(false)),
      )
      .subscribe({
        next: (medicos) => {
          this.medicos.set(medicos);
        },
        error: () => {
          this.errorMedicos.set(TEXTO_ERROR_MEDICOS);
        },
      });
  }

  seleccionarMedico(medico: MedicoListItem): void {
    if (this.medicoSeleccionado()?.id === medico.id) {
      return;
    }

    this.medicoSeleccionado.set(medico);
    this.franjaSeleccionada.set(null);
    this.errorConfirmacion.set(null);
    this.errorSlots.set(null);
    this.actualizarParametrosUrl({ medico: medico.id });
    this.cargarDisponibilidad();
  }

  seleccionarDia(dia: DiaReservable): void {
    if (this.fechaSeleccionada()?.fechaIso === dia.fechaIso) {
      return;
    }
    this.fechaSeleccionada.set(dia);
    this.franjaSeleccionada.set(null);
    this.errorConfirmacion.set(null);
    this.actualizarParametrosUrl({ fecha: dia.fechaIso });
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad(): void {
    const medico = this.medicoSeleccionado();
    const dia = this.fechaSeleccionada();

    if (!medico || !dia) {
      this.slots.set([]);
      this.cargandoSlots.set(false);
      return;
    }

    const secuencia = (this.secuenciaDisponibilidad += 1);
    this.cargandoSlots.set(true);
    this.errorSlots.set(null);

    this.medicosService
      .obtenerDisponibilidad(medico.id, dia.fechaIso)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (secuencia === this.secuenciaDisponibilidad) {
            this.cargandoSlots.set(false);
          }
        }),
      )
      .subscribe({
        next: (slots) => {
          if (secuencia !== this.secuenciaDisponibilidad) {
            return;
          }
          this.slots.set(slots);
        },
        error: () => {
          if (secuencia !== this.secuenciaDisponibilidad) {
            return;
          }
          this.errorSlots.set(TEXTO_ERROR_DISPONIBILIDAD);
          this.slots.set([]);
        },
      });
  }

  confirmar(): void {
    const resumen = this.resumen();
    if (!resumen || this.confirmando()) {
      return;
    }

    const { medico, dia } = resumen;
    this.confirmando.set(true);
    this.errorConfirmacion.set(null);

    this.reservasService
      .crearReserva({ idMedico: medico.id, fechaHora: resumen.fechaHoraIso })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.confirmando.set(false)),
      )
      .subscribe({
        next: (reserva) => {
          this.reservaConfirmada.set({
            reserva,
            medico,
            etiquetaFecha: dia.etiquetaCompleta,
            rangoHorario: formatearRangoHorarioReserva(reserva.fechaHora),
          });
          this.franjaSeleccionada.set(null);
          this.cargarDisponibilidad();
        },
        error: (error: unknown) => {
          const fallo = clasificarFalloHttp(error, TEXTOS_FALLO_RESERVA);
          this.errorConfirmacion.set(fallo.mensaje);

          if (fallo.requiereRecargar) {
            this.franjaSeleccionada.set(null);
            this.cargarDisponibilidad();
          }
        },
      });
  }

  irAMisTurnos(): void {
    this.router.navigate([RUTAS.MIS_TURNOS]);
  }

  reiniciar(): void {
    this.reservaConfirmada.set(null);
    this.franjaSeleccionada.set(null);
    this.medicoSeleccionado.set(null);
    this.fechaSeleccionada.set(this.rangoFechas().diasHabiles[0] ?? null);
    this.slots.set([]);
    this.errorConfirmacion.set(null);
    this.actualizarParametrosUrl({ medico: null, fecha: null });
  }

  alCambiarFechaDate(nuevaFecha: Date | null): void {
    if (!nuevaFecha || Number.isNaN(nuevaFecha.getTime())) {
      return;
    }
    const fechaIso = obtenerFechaLocalIso(nuevaFecha);
    const dia = construirDiaReservable(fechaIso);
    if (dia) {
      this.seleccionarDia(dia);
    }
  }

  private actualizarParametrosUrl(queryParams: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

export default ReservarTurno;
