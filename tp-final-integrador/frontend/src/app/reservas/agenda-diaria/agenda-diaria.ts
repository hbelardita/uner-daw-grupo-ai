import { DatePipe, formatDate, I18nPluralPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, LOCALE_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../auth/auth-service';
import { EmptyState, EstadoBadge, SelectorFecha } from '../../shared';
import { DocumentoPipe } from '../../shared/documento-pipe';
import { clasificarFalloHttp, type TextosFalloHttp } from '../../shared/functions/fallo-http';
import { puedeRegistrarAsistencia } from '../regla-asistencia';
import { obtenerFechaLocalIso } from '../../shared/functions/fecha-clinica';
import type { EstadoAsistencia } from '../reserva';
import { ReservasService } from '../reservas-service';
import type { FranjaHorariaAgenda, TurnoAgenda } from '../turno-agenda';
import { construirFranjasAgenda } from '../turno-agenda.mapper';

interface AsistenciaConfig {
  readonly header: string;
  readonly icon: string;
  readonly acceptLabel: string;
  readonly acceptSeverity: 'success' | 'warn' | 'danger';
  readonly verboAria: string;
  readonly generarMensaje: (paciente: string, hora: string) => string;
}

const CONFIG_ASISTENCIA: Record<EstadoAsistencia, AsistenciaConfig> = {
  ATENDIDO: {
    header: 'Confirmar atención',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Marcar atendido',
    acceptSeverity: 'success',
    verboAria: 'Marcar atendido a',
    generarMensaje: (paciente, hora) => `¿Marcar como atendido el turno de ${paciente} (${hora})?`,
  },
  AUSENTE: {
    header: 'Confirmar inasistencia',
    icon: 'pi pi-user-minus',
    acceptLabel: 'Marcar ausente',
    acceptSeverity: 'warn',
    verboAria: 'Marcar ausente a',
    generarMensaje: (paciente, hora) => `¿Marcar como ausente a ${paciente} (${hora})?`,
  },
};

const TEXTOS_FALLO_ASISTENCIA: TextosFalloHttp = {
  desincronizado: 'El turno ya no existe. Actualizamos tu agenda.',
  sinPermiso: 'No tenés permiso para registrar este turno.',
  generico: 'No pudimos registrar la asistencia. Por favor, intentá nuevamente.',
};

@Component({
  selector: 'app-agenda-diaria',
  imports: [
    DatePipe,
    I18nPluralPipe,
    FormsModule,
    TableModule,
    Card,
    SelectorFecha,
    Skeleton,
    Button,
    ToggleSwitch,
    ConfirmDialog,
    EstadoBadge,
    EmptyState,
    DocumentoPipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './agenda-diaria.html',
})
export default class AgendaDiaria {
  private readonly reservasService = inject(ReservasService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly locale = inject(LOCALE_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly fecha = input<string | undefined>(undefined);

  protected readonly ocultarLibres = signal<boolean>(false);

  protected readonly mapaPluralOcupados: Record<string, string> = {
    '=1': 'ocupado',
    other: 'ocupados',
  };
  protected readonly modificandoId = signal<number | null>(null);

  protected readonly mapaPluralTurnos: Record<string, string> = {
    '=1': 'turno',
    other: 'turnos',
  };

  protected readonly mapaPluralLibres: Record<string, string> = {
    '=1': 'libre',
    other: 'libres',
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

  protected readonly reservas = signal<TurnoAgenda[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly franjas = computed<FranjaHorariaAgenda[]>(() =>
    construirFranjasAgenda(this.reservas()),
  );
  protected readonly franjasVisibles = computed<FranjaHorariaAgenda[]>(() =>
    this.ocultarLibres() ? this.franjas().filter((f) => f.tipo === 'OCUPADA') : this.franjas(),
  );
  protected readonly totalFranjas = computed<number>(() => this.franjas().length);
  protected readonly totalOcupados = computed<number>(
    () => this.franjas().filter((f) => f.tipo === 'OCUPADA').length,
  );
  protected readonly totalLibres = computed<number>(
    () => this.franjas().filter((f) => f.tipo === 'LIBRE').length,
  );

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
          if (!idMedico) {
            return of([]);
          }

          return this.reservasService.obtenerTurnosMedico(idMedico, fecha).pipe(
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

  alCambiarOcultarLibres(valor: boolean): void {
    this.ocultarLibres.set(valor);
  }
  puedeMarcarAsistencia(turno: TurnoAgenda): boolean {
    return puedeRegistrarAsistencia(turno, new Date());
  }

  protected estaModificando(turno: TurnoAgenda): boolean {
    return this.modificandoId() === turno.id;
  }

  private formatearHora(fechaHora: string): string {
    return formatDate(fechaHora, 'HH:mm', this.locale);
  }

  mensajeDisponibilidad(turno: TurnoAgenda): string {
    const hora = this.formatearHora(turno.fechaHora);
    return `Disponible desde las ${hora} hs`;
  }

  ariaLabelAccion(turno: TurnoAgenda, accion: EstadoAsistencia): string {
    const hora = this.formatearHora(turno.fechaHora);
    const paciente = `${turno.paciente.nombres} ${turno.paciente.apellidos}`;
    return `${CONFIG_ASISTENCIA[accion].verboAria} ${paciente}, ${hora}`;
  }

  confirmarAsistencia(turno: TurnoAgenda, nuevoEstado: EstadoAsistencia): void {
    const hora = this.formatearHora(turno.fechaHora);
    const paciente = `${turno.paciente.nombres} ${turno.paciente.apellidos}`;
    const config = CONFIG_ASISTENCIA[nuevoEstado];

    this.confirmationService.confirm({
      message: config.generarMensaje(paciente, hora),
      header: config.header,
      icon: config.icon,
      rejectButtonProps: {
        label: 'Volver',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: config.acceptLabel,
        severity: config.acceptSeverity,
      },
      accept: () => this.registrarAsistencia(turno, nuevoEstado, paciente),
    });
  }

  private registrarAsistencia(
    turno: TurnoAgenda,
    nuevoEstado: EstadoAsistencia,
    paciente: string,
  ): void {
    const config = CONFIG_ASISTENCIA[nuevoEstado];
    this.modificandoId.set(turno.id);
    this.reservasService
      .cambiarEstado(turno.id, { estado: nuevoEstado })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.modificandoId.set(null)),
      )
      .subscribe({
        next: (reservaActualizada) => {
          this.reservas.update((actuales) =>
            actuales.map((r) =>
              r.id === turno.id
                ? {
                    ...r,
                    estado: reservaActualizada.estado,
                    fechaHora: reservaActualizada.fechaHora,
                  }
                : r,
            ),
          );
          this.messageService.add({
            severity: 'success',
            summary: config.acceptLabel,
            detail: `Se registró como ${nuevoEstado.toLowerCase()} el turno de ${paciente}.`,
          });
        },
        error: (error: unknown) => {
          const fallo = clasificarFalloHttp(error, TEXTOS_FALLO_ASISTENCIA);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo registrar',
            detail: fallo.mensaje,
          });
          if (fallo.requiereRecargar) {
            this.cargarReservas();
          }
        },
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

  cargarReservas(): void {
    this.error.set(null);
    this.recargarTrigger.update((n) => n + 1);
  }
}

export { AgendaDiaria };
