import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { RUTAS } from '../../constantes/rutas';
import { CancelarTurnoDialog, EmptyState, EstadoBadge } from '../../shared';
import { formatearFechaHoraTurno } from '../../shared/functions/utils';
import {
  clasificarFalloCancelacion,
  debeMostrarCancelacionDeshabilitada,
  puedeCancelar,
} from '../regla-cancelacion';
import type { FalloCancelacion } from '../regla-cancelacion';
import type { HistorialReservaResponse } from '../reservas-dto';
import { ReservasService } from '../reservas-service';

export type VistaTurnos = 'proximos' | 'historial';

function obtenerInicioDiaHoy(): number {
  const hoyEnBsAs = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${hoyEnBsAs}T00:00:00-03:00`).getTime();
}

@Component({
  selector: 'app-mis-turnos',
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    Button,
    SelectButton,
    Skeleton,
    EstadoBadge,
    EmptyState,
    CancelarTurnoDialog,
  ],
  templateUrl: './mis-turnos.html',
})
export default class MisTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rutaReservar = RUTAS.TURNOS_NUEVO;
  protected readonly reservas = signal<HistorialReservaResponse[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly vistaSeleccionada = signal<VistaTurnos>('proximos');

  protected readonly turnoACancelar = signal<HistorialReservaResponse | null>(null);
  protected readonly modalCancelacionVisible = signal<boolean>(false);
  protected readonly cancelando = signal<boolean>(false);
  protected readonly ahora = new Date();

  protected readonly puedeCancelar = puedeCancelar;
  protected readonly debeMostrarCancelacionDeshabilitada = debeMostrarCancelacionDeshabilitada;

  protected readonly proximos = computed(() => {
    const inicioHoy = obtenerInicioDiaHoy();
    return this.reservas()
      .filter((r) => r.estado === 'ACTIVO' && new Date(r.fechaHora).getTime() >= inicioHoy)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  });

  protected readonly historial = computed(() => {
    const inicioHoy = obtenerInicioDiaHoy();
    return this.reservas()
      .filter((r) => r.estado !== 'ACTIVO' || new Date(r.fechaHora).getTime() < inicioHoy)
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  });

  protected readonly conteoProximos = computed(() => this.proximos().length);

  protected readonly opcionesVista = computed(() => [
    { label: `Próximos (${this.conteoProximos()})`, value: 'proximos' as const },
    { label: 'Historial', value: 'historial' as const },
  ]);

  protected readonly turnosMostrados = computed(() =>
    this.vistaSeleccionada() === 'proximos' ? this.proximos() : this.historial(),
  );

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando.set(true);
    this.reservasService
      .obtenerMisReservas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.error.set(null);
          this.reservas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar tus turnos.');
          this.cargando.set(false);
        },
      });
  }

  cambiarVista(nuevaVista: VistaTurnos | null): void {
    if (nuevaVista) {
      this.vistaSeleccionada.set(nuevaVista);
    }
  }

  formatearFechaHora(fechaIso: string): string {
    return formatearFechaHoraTurno(fechaIso);
  }

  abrirModalCancelacion(reserva: HistorialReservaResponse): void {
    this.turnoACancelar.set(reserva);
    this.modalCancelacionVisible.set(true);
  }

  cerrarModalCancelacion(): void {
    if (this.cancelando()) {
      return;
    }
    this.modalCancelacionVisible.set(false);
    this.turnoACancelar.set(null);
  }

  confirmarCancelacion(): void {
    const turno = this.turnoACancelar();
    if (!turno) {
      return;
    }

    this.cancelando.set(true);
    this.reservasService
      .cancelarReserva(turno.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservaCancelada) => {
          this.reservas.update((actuales) =>
            actuales.map((r) =>
              r.id === reservaCancelada.id ? { ...r, estado: reservaCancelada.estado } : r,
            ),
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Turno cancelado',
            detail: 'El turno fue cancelado correctamente.',
          });
          this.cancelando.set(false);
          this.modalCancelacionVisible.set(false);
          this.turnoACancelar.set(null);
        },
        error: (error: unknown) => {
          this.cancelando.set(false);
          const fallo = this.clasificar(error);
          this.messageService.add({
            severity: 'error',
            summary: fallo.tipo === 'desincronizado' ? 'Turno no disponible' : 'Error al cancelar',
            detail: fallo.mensaje,
          });
          if (fallo.tipo === 'desincronizado') {
            this.cerrarModalCancelacion();
            this.cargarReservas();
          }
        },
      });
  }

  private clasificar(error: unknown): FalloCancelacion {
    if (error instanceof HttpErrorResponse) {
      return clasificarFalloCancelacion({ status: error.status, cuerpo: error.error });
    }
    return clasificarFalloCancelacion(null);
  }
}
