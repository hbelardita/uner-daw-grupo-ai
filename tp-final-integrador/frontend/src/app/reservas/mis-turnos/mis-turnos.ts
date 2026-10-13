import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth-service';
import { EmptyState, EstadoBadge } from '../../shared';
import { debeMostrarCancelacionDeshabilitada, puedeCancelar } from '../regla-cancelacion';
import { HistorialReservaResponse } from '../reservas-dto';
import { ReservasService } from '../reservas-service';

@Component({
  selector: 'app-mis-turnos',
  imports: [
    DatePipe,
    CurrencyPipe,
    TableModule,
    Card,
    Skeleton,
    Button,
    Tooltip,
    ConfirmDialog,
    EstadoBadge,
    EmptyState,
  ],
  providers: [ConfirmationService, DatePipe],
  templateUrl: './mis-turnos.html',
})
export default class MisTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  protected readonly reservas = signal<HistorialReservaResponse[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cancelandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarReservas();
  }

  protected motivoCancelacion(): string {
    return 'Solo podés cancelar hasta el día anterior a la consulta.';
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

  protected puedeCancelarReserva(reserva: HistorialReservaResponse): boolean {
    const rol = this.authService.rol() ?? 'PACIENTE';
    return puedeCancelar(reserva, rol, new Date());
  }

  protected debeMostrarCancelacionDeshabilitada(reserva: HistorialReservaResponse): boolean {
    const rol = this.authService.rol() ?? 'PACIENTE';
    return debeMostrarCancelacionDeshabilitada(reserva, rol, new Date());
  }

  protected estaCancelando(reserva: HistorialReservaResponse): boolean {
    return this.cancelandoId() === reserva.id;
  }

  protected confirmarCancelacion(reserva: HistorialReservaResponse): void {
    const fecha = this.datePipe.transform(reserva.fechaHora, 'dd/MM/yyyy') ?? '';
    const hora = this.datePipe.transform(reserva.fechaHora, 'HH:mm') ?? '';
    const medico = `${reserva.medico.nombres} ${reserva.medico.apellidos}`;

    this.confirmationService.confirm({
      message: `¿Cancelar tu turno del ${fecha} a las ${hora} con ${medico}? Esta acción no se puede deshacer.`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Volver',
        severity: 'secondary',
        text: true,
      },
      acceptButtonProps: {
        label: 'Cancelar turno',
        severity: 'danger',
      },
      accept: () => {
        this.cancelandoId.set(reserva.id);
        this.reservasService
          .cancelarReserva(reserva.id)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cancelandoId.set(null)),
          )
          .subscribe({
            next: (reservaCancelada) => {
              this.reservas.update((actuales) =>
                actuales.map((r) =>
                  r.id === reserva.id
                    ? {
                        ...r,
                        estado: reservaCancelada.estado,
                        fechaHora: reservaCancelada.fechaHora,
                        valorConsulta: reservaCancelada.valorConsulta,
                      }
                    : r,
                ),
              );
              this.messageService.add({
                severity: 'success',
                summary: 'Turno cancelado',
                detail: `Tu turno del ${fecha} fue cancelado exitosamente.`,
              });
            },
            error: (error: unknown) => {
              this.messageService.add({
                severity: 'error',
                summary: 'No se pudo cancelar',
                detail: this.mensajeErrorCancelacion(error),
              });
              if (error instanceof HttpErrorResponse && error.status === 409) {
                this.cargarReservas();
              }
            },
          });
      },
    });
  }

  private mensajeErrorCancelacion(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const mensajeBackend = typeof error.error?.message === 'string' ? error.error.message : null;
      if (mensajeBackend) {
        return mensajeBackend;
      }
      if (error.status === 404) {
        return 'El turno ya no existe. Actualizamos tu lista.';
      }
      if (error.status === 403) {
        return 'No tenés permiso para cancelar este turno.';
      }
    }
    return 'No pudimos cancelar tu turno. Por favor, intentá nuevamente.';
  }
}
