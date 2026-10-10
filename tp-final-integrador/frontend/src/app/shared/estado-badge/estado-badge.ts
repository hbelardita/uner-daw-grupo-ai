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
    icon: 'pi pi-calendar',
    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  ATENDIDO: {
    label: 'Atendido',
    icon: 'pi pi-check-circle',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  AUSENTE: {
    label: 'Ausente',
    icon: 'pi pi-user-minus',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: 'pi pi-times-circle',
    cls: 'bg-rose-50 text-rose-700 border-rose-200',
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
