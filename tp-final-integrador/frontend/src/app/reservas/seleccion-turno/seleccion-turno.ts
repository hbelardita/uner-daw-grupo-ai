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
import {
  outputFromObservable,
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, type Params } from '@angular/router';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { finalize } from 'rxjs';
import type { DisponibilidadSlot, MedicoListItem } from '../../medicos/medico';
import { MedicosService } from '../../medicos/medicos-service';
import { EmptyState, FranjasHorariasGrid, SelectorFecha } from '../../shared';
import { obtenerFechaLocalIso } from '../../shared/functions/fecha-clinica';
import {
  construirDiaReservable,
  esFechaReservableValida,
  formatearRangoHorarioReserva,
  obtenerRangoFechasReserva,
  type DiaReservable,
  type RangoFechasReserva,
} from '../regla-reserva';

const TEXTO_ERROR_MEDICOS = 'No pudimos cargar los profesionales. Por favor, reintentá.';
const TEXTO_ERROR_DISPONIBILIDAD = 'No pudimos cargar la disponibilidad. Por favor, reintentá.';

/** Selección completa de profesional, fecha y horario para reservar un turno. */
export interface SeleccionTurnoVista {
  medico: MedicoListItem;
  fechaHoraIso: string;
  etiquetaFecha: string;
  rangoHorario: string;
}

@Component({
  selector: 'app-seleccion-turno',
  imports: [CurrencyPipe, Button, Skeleton, EmptyState, FranjasHorariasGrid, SelectorFecha],
  templateUrl: './seleccion-turno.html',
})
export class SeleccionTurno implements OnInit {
  private readonly medicosService = inject(MedicosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly habilitado = input(true);

  private readonly parametros = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly medicoParam = computed<string | null>(() => this.parametros().get('medico'));
  private readonly fechaParam = computed<string | null>(() => this.parametros().get('fecha'));

  /**
   * Secuencia de la última solicitud de disponibilidad emitida.
   * Permite descartar respuestas que llegan fuera de orden.
   */
  private secuenciaDisponibilidad = 0;

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

  readonly fechaMinima = computed<Date>(() => this.rangoFechas().fechaMinima);
  readonly fechaMaxima = computed<Date>(() => this.rangoFechas().fechaMaxima);
  readonly fechaSeleccionadaDate = computed<Date>(
    () => this.fechaSeleccionada()?.fechaDate ?? this.rangoFechas().fechaMinima,
  );

  readonly seleccionActual = computed<SeleccionTurnoVista | null>(() => {
    const medico = this.medicoSeleccionado();
    const dia = this.fechaSeleccionada();
    const franja = this.franjaSeleccionada();

    if (!medico || !dia || !franja) {
      return null;
    }

    return {
      medico,
      fechaHoraIso: franja,
      etiquetaFecha: dia.etiquetaCompleta,
      rangoHorario: formatearRangoHorarioReserva(franja),
    };
  });

  readonly seleccion = outputFromObservable(toObservable(this.seleccionActual));

  constructor() {
    effect(() => {
      this.sincronizarConParametros();
    });
  }

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
    if (!this.habilitado() || this.medicoSeleccionado()?.id === medico.id) {
      return;
    }

    this.medicoSeleccionado.set(medico);
    this.franjaSeleccionada.set(null);
    this.errorSlots.set(null);
    this.actualizarParametrosUrl({ medico: medico.id });
    this.cargarDisponibilidad();
  }

  seleccionarDia(dia: DiaReservable): void {
    if (!this.habilitado() || this.fechaSeleccionada()?.fechaIso === dia.fechaIso) {
      return;
    }
    this.fechaSeleccionada.set(dia);
    this.franjaSeleccionada.set(null);
    this.errorSlots.set(null);
    this.actualizarParametrosUrl({ fecha: dia.fechaIso });
    this.cargarDisponibilidad();
  }

  alCambiarFechaDate(nuevaFecha: Date | null): void {
    if (!this.habilitado() || !nuevaFecha || Number.isNaN(nuevaFecha.getTime())) {
      return;
    }
    const fechaIso = obtenerFechaLocalIso(nuevaFecha);
    const dia = construirDiaReservable(fechaIso);
    if (dia) {
      this.seleccionarDia(dia);
    }
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

  /** Descarta la franja elegida y vuelve a pedir la disponibilidad de la fecha actual. */
  recargarDisponibilidad(): void {
    this.franjaSeleccionada.set(null);
    this.cargarDisponibilidad();
  }

  reiniciar(): void {
    this.secuenciaDisponibilidad += 1;
    this.franjaSeleccionada.set(null);
    this.medicoSeleccionado.set(null);
    this.fechaSeleccionada.set(this.rangoFechas().diasHabiles[0] ?? null);
    this.slots.set([]);
    this.cargandoSlots.set(false);
    this.errorSlots.set(null);
    this.actualizarParametrosUrl({ medico: null, fecha: null });
  }

  private sincronizarConParametros(): void {
    const medicoParam = this.medicoParam();
    const fechaParam = this.fechaParam();
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
