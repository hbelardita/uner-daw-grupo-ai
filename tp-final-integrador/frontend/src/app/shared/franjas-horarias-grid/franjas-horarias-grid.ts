import { Component, computed, input, model } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import type { DisponibilidadSlot } from '../../medicos/medico';
import { HORAS_JORNADA_MEDICA, type HoraJornada } from '../../reservas/turno-agenda';
import { extraerHoraClinica } from '../../shared/functions/fecha-clinica';

export type EstadoFranja = 'SELECCIONADA' | 'DISPONIBLE' | 'OCUPADA';

export interface FranjaUiConfig {
  readonly clasesBoton: string;
  readonly mostrarCheck: boolean;
  readonly etiquetaSecundaria: string | null;
}

export const FRANJA_UI_CONFIG: Record<EstadoFranja, FranjaUiConfig> = {
  SELECCIONADA: {
    clasesBoton: 'bg-primary border-primary text-white ring-2 ring-[#0891b2] cursor-pointer',
    mostrarCheck: true,
    etiquetaSecundaria: null,
  },
  DISPONIBLE: {
    clasesBoton:
      'bg-white border-slate-300 text-slate-900 hover:border-primary hover:bg-primary-subtle cursor-pointer',
    mostrarCheck: false,
    etiquetaSecundaria: null,
  },
  OCUPADA: {
    clasesBoton: 'bg-muted border-slate-200 text-muted-foreground cursor-not-allowed',
    mostrarCheck: false,
    etiquetaSecundaria: 'Ocupado',
  },
};

export interface FranjaHorariaItem {
  readonly hora: HoraJornada;
  readonly etiquetaHora: string;
  readonly fechaHora: string | null;
  readonly estado: EstadoFranja;
  readonly disponible: boolean;
  readonly seleccionada: boolean;
  readonly ui: FranjaUiConfig;
}

@Component({
  selector: 'app-franjas-horarias-grid',
  imports: [Skeleton],
  templateUrl: './franjas-horarias-grid.html',
})
export class FranjasHorariasGrid {
  readonly slots = input<readonly DisponibilidadSlot[]>([]);
  readonly seleccionado = model<string | null>(null);
  readonly cargando = input<boolean>(false);

  protected readonly skeletonItems = HORAS_JORNADA_MEDICA;

  protected readonly franjas = computed<FranjaHorariaItem[]>(() => {
    const slotsPorHora = new Map<string, DisponibilidadSlot>();
    for (const slot of this.slots()) {
      const hora = extraerHoraClinica(slot.fechaHora);
      if (hora && !slotsPorHora.has(hora)) {
        slotsPorHora.set(hora, slot);
      }
    }

    const actualSeleccionado = this.seleccionado();
    const horaSeleccionada = actualSeleccionado ? extraerHoraClinica(actualSeleccionado) : '';

    return HORAS_JORNADA_MEDICA.map((hora) => {
      const slot = slotsPorHora.get(hora);
      const fechaHora = slot?.fechaHora ?? null;
      const disponible = Boolean(slot?.disponible && fechaHora);
      const seleccionada = Boolean(
        disponible &&
        fechaHora &&
        (actualSeleccionado === fechaHora || (horaSeleccionada && horaSeleccionada === hora)),
      );
      const estado: EstadoFranja = seleccionada
        ? 'SELECCIONADA'
        : disponible
          ? 'DISPONIBLE'
          : 'OCUPADA';
      return {
        hora,
        etiquetaHora: `${hora} hs`,
        fechaHora,
        estado,
        disponible,
        seleccionada,
        ui: FRANJA_UI_CONFIG[estado],
      };
    });
  });

  protected alSeleccionar(franja: FranjaHorariaItem): void {
    if (this.cargando() || !franja.disponible || !franja.fechaHora) {
      return;
    }
    this.seleccionado.set(franja.fechaHora);
  }
}
