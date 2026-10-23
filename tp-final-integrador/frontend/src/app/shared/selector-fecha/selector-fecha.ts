import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import {
  crearInstanteMediodiaClinica,
  esMismaFechaLocal,
  obtenerFechaLocalIso,
} from '../../shared/functions/fecha-clinica';

function moverDiaIso(iso: string, direccion: -1 | 1): string {
  const fechaUtc = new Date(`${iso}T12:00:00Z`);
  fechaUtc.setUTCDate(fechaUtc.getUTCDate() + direccion);
  return fechaUtc.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-selector-fecha',
  imports: [FormsModule, Button, DatePicker],
  templateUrl: './selector-fecha.html',
})
export class SelectorFecha {
  readonly fecha = model<Date>(new Date());
  readonly minDate = input<Date | undefined>(undefined);
  readonly maxDate = input<Date | undefined>(undefined);
  readonly diasDeshabilitados = input<number[]>([0, 6]);
  readonly ariaLabel = input<string>('Seleccionar fecha');
  readonly anchoClass = input<string>('w-36 min-[400px]:w-44 sm:w-56');
  readonly deshabilitado = input<boolean>(false);

  protected readonly esFechaDeHoy = computed<boolean>(() => {
    const actual = this.fecha();
    if (!actual || Number.isNaN(actual.getTime())) {
      return false;
    }
    return esMismaFechaLocal(actual, new Date());
  });

  protected readonly hayDiaAnterior = computed<boolean>(() => {
    if (this.deshabilitado()) {
      return false;
    }
    return this.calcularDiaAnterior() !== null;
  });

  protected readonly hayDiaSiguiente = computed<boolean>(() => {
    if (this.deshabilitado()) {
      return false;
    }
    return this.calcularDiaSiguiente() !== null;
  });

  alCambiarFechaPicker(nuevaFecha: Date | null): void {
    if (this.deshabilitado() || !nuevaFecha || Number.isNaN(nuevaFecha.getTime())) {
      return;
    }
    this.fecha.set(nuevaFecha);
  }

  diaAnterior(): void {
    if (this.deshabilitado()) {
      return;
    }
    const anterior = this.calcularDiaAnterior();
    if (anterior) {
      this.fecha.set(anterior);
    }
  }

  diaSiguiente(): void {
    if (this.deshabilitado()) {
      return;
    }
    const siguiente = this.calcularDiaSiguiente();
    if (siguiente) {
      this.fecha.set(siguiente);
    }
  }

  irAHoy(): void {
    if (this.deshabilitado()) {
      return;
    }
    const hoy = new Date();
    const hoyIso = obtenerFechaLocalIso(hoy);
    if (!hoyIso) {
      return;
    }

    const diaSemanaHoy = new Date(`${hoyIso}T12:00:00Z`).getUTCDay();
    const deshabilitados = this.diasDeshabilitados();
    const min = this.minDate();
    const max = this.maxDate();
    const minIso = min ? obtenerFechaLocalIso(min) : null;
    const maxIso = max ? obtenerFechaLocalIso(max) : null;
    const dentroDeLimites = (!minIso || hoyIso >= minIso) && (!maxIso || hoyIso <= maxIso);

    if (!deshabilitados.includes(diaSemanaHoy) && dentroDeLimites) {
      this.fecha.set(hoy);
      return;
    }

    const primerHabilitado = this.buscarDiaHabilitado(hoyIso, 1, deshabilitados, max);
    if (primerHabilitado) {
      this.fecha.set(primerHabilitado);
    } else {
      this.fecha.set(hoy);
    }
  }

  private calcularDiaAnterior(): Date | null {
    const actual = this.fecha();
    if (!actual || Number.isNaN(actual.getTime())) {
      return null;
    }
    const isoActual = obtenerFechaLocalIso(actual);
    if (!isoActual) {
      return null;
    }
    return this.buscarDiaHabilitado(isoActual, -1, this.diasDeshabilitados(), this.minDate());
  }

  private calcularDiaSiguiente(): Date | null {
    const actual = this.fecha();
    if (!actual || Number.isNaN(actual.getTime())) {
      return null;
    }
    const isoActual = obtenerFechaLocalIso(actual);
    if (!isoActual) {
      return null;
    }
    return this.buscarDiaHabilitado(isoActual, 1, this.diasDeshabilitados(), this.maxDate());
  }

  private buscarDiaHabilitado(
    desdeIso: string,
    direccion: -1 | 1,
    diasDeshabilitados: readonly number[],
    limite?: Date,
  ): Date | null {
    const limiteIso = limite ? obtenerFechaLocalIso(limite) : null;
    let isoCursor = desdeIso;

    for (let paso = 1; paso <= 31; paso += 1) {
      isoCursor = moverDiaIso(isoCursor, direccion);

      if (limiteIso) {
        if (direccion === -1 && isoCursor < limiteIso) {
          return null;
        }
        if (direccion === 1 && isoCursor > limiteIso) {
          return null;
        }
      }

      const diaSemana = new Date(`${isoCursor}T12:00:00Z`).getUTCDay();
      if (!diasDeshabilitados.includes(diaSemana)) {
        return crearInstanteMediodiaClinica(isoCursor);
      }
    }

    return null;
  }
}
