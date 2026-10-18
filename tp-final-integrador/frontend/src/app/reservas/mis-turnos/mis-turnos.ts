import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { RUTAS } from '../../constantes/rutas';
import { EmptyState, EstadoBadge } from '../../shared';
import type { Reserva } from '../reserva';
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

function formatearFechaHoraTurno(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return fechaIso;

    const partes = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).formatToParts(fecha);

    const diaSemana = partes.find((p) => p.type === 'weekday')?.value ?? '';
    const dia = partes.find((p) => p.type === 'day')?.value ?? '';
    const mes = partes.find((p) => p.type === 'month')?.value ?? '';
    const anio = partes.find((p) => p.type === 'year')?.value ?? '';
    const diaCapitalizado = diaSemana ? diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1) : '';

    const horaStr = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(fecha);

    return `${diaCapitalizado} ${dia}/${mes}/${anio} · ${horaStr} hs`;
  } catch {
    return fechaIso;
  }
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
  ],
  templateUrl: './mis-turnos.html',
})
export default class MisTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rutaReservar = RUTAS.TURNOS_NUEVO;
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly vistaSeleccionada = signal<VistaTurnos>('proximos');

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
}
