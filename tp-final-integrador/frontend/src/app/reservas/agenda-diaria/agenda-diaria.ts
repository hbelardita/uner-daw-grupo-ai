import { DatePipe, I18nPluralPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { catchError, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../auth/auth-service';
import { EmptyState, EstadoBadge } from '../../shared';
import { DocumentoPipe } from '../../shared/documento-pipe';
import { obtenerFechaLocalIso } from '../regla-cancelacion';
import type { Reserva } from '../reserva';
import { ReservasService } from '../reservas-service';

@Component({
  selector: 'app-agenda-diaria',
  imports: [
    DatePipe,
    I18nPluralPipe,
    FormsModule,
    TableModule,
    Card,
    DatePicker,
    Skeleton,
    Button,
    EstadoBadge,
    EmptyState,
    DocumentoPipe,
  ],
  providers: [DatePipe],
  templateUrl: './agenda-diaria.html',
})
export default class AgendaDiaria {
  private readonly reservasService = inject(ReservasService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly fecha = input<string | undefined>(undefined);

  protected readonly mapaPluralTurnos: Record<string, string> = {
    '=1': 'turno',
    other: 'turnos',
  };

  protected readonly mapaPluralActivos: Record<string, string> = {
    '=1': 'activo',
    other: 'activos',
  };

  protected readonly mapaPluralAtendidos: Record<string, string> = {
    '=1': 'atendido',
    other: 'atendidos',
  };

  protected readonly fechaSeleccionada = computed<Date>(() => {
    const param = this.fecha();
    if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
      const parsedDate = new Date(`${param}T12:00:00`);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  });

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly totalTurnos = computed<number>(() => this.reservas().length);
  protected readonly totalReservados = computed<number>(
    () => this.reservas().filter((r) => r.estado === 'ACTIVO').length,
  );
  protected readonly totalAtendidos = computed<number>(
    () => this.reservas().filter((r) => r.estado === 'ATENDIDO').length,
  );
  protected readonly totalAusentes = computed<number>(
    () => this.reservas().filter((r) => r.estado === 'AUSENTE').length,
  );
  protected readonly esFechaDeHoy = computed<boolean>(() => {
    return obtenerFechaLocalIso(this.fechaSeleccionada()) === obtenerFechaLocalIso(new Date());
  });

  private readonly recargarTrigger = signal<number>(0);

  constructor() {
    toObservable(
      computed(() => ({
        fecha: this.fechaSeleccionada(),
        recarga: this.recargarTrigger(),
      })),
    )
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ fecha }) => {
          const medico = this.authService.medico();
          const idMedico = medico?.id;

          return this.reservasService
            .obtenerReservas({
              fecha,
              ...(idMedico ? { idMedico } : {}),
            })
            .pipe(
              catchError(() => {
                this.error.set('No pudimos cargar los turnos de tu agenda.');
                return of([]);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (!this.error()) {
          this.reservas.set(data);
        }
        this.cargando.set(false);
      });
  }

  alCambiarFecha(nuevaFecha: Date | null): void {
    if (!nuevaFecha || Number.isNaN(nuevaFecha.getTime())) {
      return;
    }
    const fechaIso = obtenerFechaLocalIso(nuevaFecha);
    if (fechaIso === obtenerFechaLocalIso(this.fechaSeleccionada())) {
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { fecha: fechaIso },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  diaAnterior(): void {
    const actual = new Date(this.fechaSeleccionada());
    actual.setDate(actual.getDate() - 1);
    this.alCambiarFecha(actual);
  }

  diaSiguiente(): void {
    const actual = new Date(this.fechaSeleccionada());
    actual.setDate(actual.getDate() + 1);
    this.alCambiarFecha(actual);
  }

  irAHoy(): void {
    this.alCambiarFecha(new Date());
  }

  cargarReservas(): void {
    this.error.set(null);
    this.recargarTrigger.update((n) => n + 1);
  }
}

export { AgendaDiaria };
