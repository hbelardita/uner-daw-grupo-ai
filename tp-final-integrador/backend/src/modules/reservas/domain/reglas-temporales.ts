import { BadRequestException } from '@nestjs/common';

export const ZONA_HORARIA_CLINICA = 'America/Argentina/Buenos_Aires';
export const DIAS_MAXIMOS_ANTELACION = 30;
export const PRIMERA_HORA_ATENCION = 8;
export const ULTIMA_HORA_ATENCION = 15;
export const MILISEGUNDOS_POR_DIA = 86_400_000;

export interface PartesLocales {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

const formateadorLocal = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA_CLINICA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function obtenerPartesLocales(instante: Date): PartesLocales {
  const partes = formateadorLocal.formatToParts(instante);
  const obtener = (tipo: Intl.DateTimeFormatPartTypes): number => {
    const parte = partes.find((p) => p.type === tipo);
    return parte === undefined ? Number.NaN : Number.parseInt(parte.value, 10);
  };

  return {
    anio: obtener('year'),
    mes: obtener('month'),
    dia: obtener('day'),
    hora: obtener('hour'),
    minuto: obtener('minute'),
  };
}

export function esFinDeSemana(partes: PartesLocales): boolean {
  const diaSemana = new Date(
    Date.UTC(partes.anio, partes.mes - 1, partes.dia),
  ).getUTCDay();
  return diaSemana === 0 || diaSemana === 6;
}

export function estaDentroDeLaVentanaDeAtencion(
  partes: PartesLocales,
): boolean {
  return (
    partes.hora >= PRIMERA_HORA_ATENCION &&
    partes.hora <= ULTIMA_HORA_ATENCION &&
    partes.minuto === 0
  );
}

export function diferenciaDiasCalendario(
  desde: PartesLocales,
  hasta: PartesLocales,
): number {
  const midiendoDesde = Date.UTC(desde.anio, desde.mes - 1, desde.dia);
  const midiendoHasta = Date.UTC(hasta.anio, hasta.mes - 1, hasta.dia);
  return Math.round((midiendoHasta - midiendoDesde) / MILISEGUNDOS_POR_DIA);
}

export function validarReglasCreacionReserva(
  fechaHora: Date,
  ahora: Date = new Date(),
): void {
  if (Number.isNaN(fechaHora.getTime())) {
    throw new BadRequestException('La fecha y hora del turno no es válida.');
  }
  if (Number.isNaN(ahora.getTime())) {
    throw new BadRequestException(
      'La fecha y hora de referencia no es válida.',
    );
  }

  const partesTurno = obtenerPartesLocales(fechaHora);

  if (esFinDeSemana(partesTurno)) {
    throw new BadRequestException(
      'Los turnos sólo pueden agendarse de lunes a viernes.',
    );
  }

  if (!estaDentroDeLaVentanaDeAtencion(partesTurno)) {
    throw new BadRequestException(
      'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
    );
  }

  if (fechaHora.getTime() <= ahora.getTime()) {
    throw new BadRequestException('No se pueden agendar turnos en el pasado.');
  }

  const partesAhora = obtenerPartesLocales(ahora);
  const diasDeAntelacion = diferenciaDiasCalendario(partesAhora, partesTurno);

  if (diasDeAntelacion > DIAS_MAXIMOS_ANTELACION) {
    throw new BadRequestException(
      'Los turnos no pueden agendarse con más de 30 días de antelación.',
    );
  }
}

export function validarAntelacionCancelacion(
  fechaHoraTurno: Date,
  ahora: Date = new Date(),
): void {
  if (Number.isNaN(fechaHoraTurno.getTime())) {
    throw new BadRequestException('La fecha y hora del turno no es válida.');
  }
  if (Number.isNaN(ahora.getTime())) {
    throw new BadRequestException(
      'La fecha y hora de referencia no es válida.',
    );
  }

  const partesAhora = obtenerPartesLocales(ahora);
  const partesTurno = obtenerPartesLocales(fechaHoraTurno);
  const diasDeAntelacion = diferenciaDiasCalendario(partesAhora, partesTurno);

  if (diasDeAntelacion <= 0) {
    throw new BadRequestException(
      'Solo se puede cancelar hasta 1 dia antes de la fecha del turno.',
    );
  }
}

export function validarCancelacionAdministrador(
  fechaHoraTurno: Date,
  ahora: Date = new Date(),
): void {
  if (Number.isNaN(fechaHoraTurno.getTime())) {
    throw new BadRequestException('La fecha y hora del turno no es válida.');
  }
  if (Number.isNaN(ahora.getTime())) {
    throw new BadRequestException(
      'La fecha y hora de referencia no es válida.',
    );
  }

  if (ahora.getTime() >= fechaHoraTurno.getTime()) {
    throw new BadRequestException(
      'No se puede cancelar una consulta médica que ya ha iniciado o transcurrido en el pasado.',
    );
  }
}
/**
 * Genera los instantes de inicio para cada slot de atencion del dia en horario local de la clinica (UTC-3).
 */
export function generarSlotsDelDia(fecha: string): Date[] {
  const slots: Date[] = [];
  for (
    let hora = PRIMERA_HORA_ATENCION;
    hora <= ULTIMA_HORA_ATENCION;
    hora += 1
  ) {
    const horaLocal = String(hora).padStart(2, '0');
    slots.push(new Date(`${fecha}T${horaLocal}:00:00-03:00`));
  }
  return slots;
}

/**
 * Parsea un string AAAA-MM-DD y valida que sea una fecha de calendario real.
 * Utiliza una sonda UTC para detectar desbordamientos silenciosos de Date.UTC (ej. 31 de febrero).
 */
export function parsearYValidarFechaCalendario(fecha: string): PartesLocales {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const sonda = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    sonda.getUTCFullYear() !== anio ||
    sonda.getUTCMonth() !== mes - 1 ||
    sonda.getUTCDate() !== dia
  ) {
    throw new BadRequestException(
      'La fecha debe tener el formato AAAA-MM-DD y ser una fecha calendario válida.',
    );
  }
  return { anio, mes, dia, hora: 0, minuto: 0 };
}
