import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { EstadoReserva } from '../../reservas/reserva';

export interface EstadoBadgeConfig {
  label: string;
  icon: string;
  cls: string;
}

export const ESTADO_BADGE_CONFIG: Record<EstadoReserva, EstadoBadgeConfig> = {
  ACTIVO: {
    label: 'Reservado',
    icon: 'pi pi-calendar-clock',
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  ATENDIDO: {
    label: 'Atendido',
    icon: 'pi pi-check-circle',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  AUSENTE: {
    label: 'Ausente',
    icon: 'pi pi-exclamation-circle',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: 'pi pi-times-circle',
    cls: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

@Component({
  selector: 'app-estado-badge',
  imports: [Tag],
  templateUrl: './estado-badge.html',
})
export class EstadoBadge {
  readonly estado = input.required<EstadoReserva>();

  protected readonly config = computed<EstadoBadgeConfig>(() => {
    const estadoActual = this.estado();
    return (
      ESTADO_BADGE_CONFIG[estadoActual] ?? {
        label: estadoActual,
        icon: 'pi pi-info-circle',
        cls: 'bg-slate-50 text-slate-700 border-slate-200',
      }
    );
  });
}
