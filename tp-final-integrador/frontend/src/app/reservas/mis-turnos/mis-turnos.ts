import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { EmptyState, EstadoBadge } from '../../shared';
import { Reserva } from '../reserva';
import { ReservasService } from '../reservas-service';

@Component({
  selector: 'app-mis-turnos',
  imports: [DatePipe, CurrencyPipe, TableModule, Card, Skeleton, Button, EstadoBadge, EmptyState],
  templateUrl: './mis-turnos.html',
})
export default class MisTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reservasService
      .obtenerMisReservas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.reservas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar tus turnos.');
          this.cargando.set(false);
        },
      });
  }
}
