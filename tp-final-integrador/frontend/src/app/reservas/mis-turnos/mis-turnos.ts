import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { EstadoBadge } from '../../shared';
import { Reserva } from '../reserva';
import { ReservasService } from '../reservas-service';

@Component({
  selector: 'app-mis-turnos',
  imports: [DatePipe, CurrencyPipe, TableModule, EstadoBadge],
  templateUrl: './mis-turnos.html',
})
export default class MisTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal<boolean>(true);

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
          this.reservas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }
}
