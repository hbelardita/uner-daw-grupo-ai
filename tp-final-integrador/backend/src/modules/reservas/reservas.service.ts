import { BadRequestException, Injectable } from '@nestjs/common';

const ZONA_HORARIA_CLINICA = 'America/Argentina/Buenos_Aires';
const DIAS_MAXIMOS_ANTELACION = 30;
const PRIMERA_HORA_ATENCION = 8;
const ULTIMA_HORA_ATENCION = 15;
const MILISEGUNDOS_POR_DIA = 86_400_000;

interface PartesLocales {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

@Injectable()
export class ReservasService {
  private static readonly formateadorLocal = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA_CLINICA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  /**
   * Valida las reglas temporales de una reserva según las reglas de negocio
   * de la clínica (ventana de atención en hora local de
   * America/Argentina/Buenos_Aires, con los instantes en UTC).
   */
  validarReglasTemporales(fechaHora: Date, ahora: Date = new Date()): void {
    if (Number.isNaN(fechaHora.getTime())) {
      throw new BadRequestException('La fecha y hora del turno no es válida.');
    }
    if (Number.isNaN(ahora.getTime())) {
      throw new BadRequestException(
        'La fecha y hora de referencia no es válida.',
      );
    }

    const partesTurno = this.obtenerPartesLocales(fechaHora);

    if (this.esFinDeSemana(partesTurno)) {
      throw new BadRequestException(
        'Los turnos sólo pueden agendarse de lunes a viernes.',
      );
    }

    if (!this.estaDentroDeLaVentanaDeAtencion(partesTurno)) {
      throw new BadRequestException(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    }

    if (fechaHora.getTime() <= ahora.getTime()) {
      throw new BadRequestException(
        'No se pueden agendar turnos en el pasado.',
      );
    }

    const partesAhora = this.obtenerPartesLocales(ahora);
    const diasDeAntelacion = this.diferenciaDiasCalendario(
      partesAhora,
      partesTurno,
    );

    if (diasDeAntelacion > DIAS_MAXIMOS_ANTELACION) {
      throw new BadRequestException(
        'Los turnos no pueden agendarse con más de 30 días de antelación.',
      );
    }
  }

  /**
   * Extrae los componentes locales (año, mes, día, hora, minuto) de un
   * instante UTC en la zona horaria de la clínica.
   */
  private obtenerPartesLocales(instante: Date): PartesLocales {
    const partes = ReservasService.formateadorLocal.formatToParts(instante);
    const obtener = (tipo: Intl.DateTimeFormatPartTypes): number => {
      const parte = partes.find((parteActual) => parteActual.type === tipo);
      return parte === undefined
        ? Number.NaN
        : Number.parseInt(parte.value, 10);
    };

    return {
      anio: obtener('year'),
      mes: obtener('month'),
      dia: obtener('day'),
      hora: obtener('hour'),
      minuto: obtener('minute'),
    };
  }

  private esFinDeSemana(partes: PartesLocales): boolean {
    // El día de la semana del calendario local no depende de la zona horaria:
    // se calcula sobre la medianoche UTC de la fecha local.
    const diaSemana = new Date(
      Date.UTC(partes.anio, partes.mes - 1, partes.dia),
    ).getUTCDay();
    return diaSemana === 0 || diaSemana === 6;
  }

  private estaDentroDeLaVentanaDeAtencion(partes: PartesLocales): boolean {
    const dentroDeLaHora =
      partes.hora >= PRIMERA_HORA_ATENCION &&
      partes.hora <= ULTIMA_HORA_ATENCION;
    const enPunto = partes.minuto === 0;

    return dentroDeLaHora && enPunto;
  }

  private diferenciaDiasCalendario(
    desde: PartesLocales,
    hasta: PartesLocales,
  ): number {
    const midiendoDesde = Date.UTC(desde.anio, desde.mes - 1, desde.dia);
    const midiendoHasta = Date.UTC(hasta.anio, hasta.mes - 1, hasta.dia);
    return Math.round((midiendoHasta - midiendoDesde) / MILISEGUNDOS_POR_DIA);
  }
}
