import type { MedicoListItem } from '../medicos/medico';
import {
  crearInstanteMediodiaClinica,
  extraerHoraClinica,
  formatearFechaLargaClinica,
  obtenerFechaLocalIso,
  sumarUnaHora,
} from '../shared/functions/fecha-clinica';
import type { CrearReservaResponse } from './reservas-dto';

const PATRON_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const MILISEGUNDOS_POR_DIA = 86_400_000;

/** Cantidad máxima de días hacia adelante en los que se permite reservar un turno. */
export const DIAS_MAXIMOS_RESERVA = 30;

const DIAS_SEMANA_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

const SABADO = 6;
const DOMINGO = 0;

/** Día del calendario habilitado para reservar un turno. */
export interface DiaReservable {
  /** Fecha local 'YYYY-MM-DD' en la zona horaria de Argentina. */
  readonly fechaIso: string;
  /** Instante correspondiente al mediodía de la fecha en UTC-3. */
  readonly fechaDate: Date;
  /** Abreviatura del día de la semana: 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie'. */
  readonly diaSemanaCorto: string;
  /** Número de día con dos dígitos, por ejemplo '19'. */
  readonly numeroDia: string;
  /** Abreviatura del mes: 'Ene' | 'Feb' | ... | 'Dic'. */
  readonly mesCorto: string;
  /** Etiqueta completa, por ejemplo 'Lunes 19/10/2026'. */
  readonly etiquetaCompleta: string;
  /** Indica si la fecha corresponde al día de hoy en UTC-3. */
  readonly esHoy: boolean;
}

/** Ventana de fechas habilitada para reservar turnos. */
export interface RangoFechasReserva {
  readonly fechaMinima: Date;
  readonly fechaMaxima: Date;
  readonly diasHabiles: readonly DiaReservable[];
}

/** Resumen de la reserva que el paciente está construyendo antes de confirmarla. */
export interface ResumenReservaActiva {
  readonly medico: MedicoListItem;
  readonly dia: DiaReservable;
  readonly fechaHoraIso: string;
  /** Rango horario legible, por ejemplo '10:00 a 11:00 hs'. */
  readonly rangoHorario: string;
  readonly valorConsulta: number;
}

/** Vista de una reserva ya confirmada, lista para mostrarse al paciente. */
export interface ReservaConfirmadaVista {
  readonly reserva: CrearReservaResponse;
  readonly medico: MedicoListItem;
  readonly etiquetaFecha: string;
  readonly rangoHorario: string;
}

/**
 * Verifica que una cadena sea una fecha ISO 'YYYY-MM-DD' que exista realmente
 * en el calendario (por ejemplo, rechaza '2026-02-31').
 */
function esFechaCalendarioValida(fechaIso: string): boolean {
  if (!PATRON_FECHA_ISO.test(fechaIso)) {
    return false;
  }

  const [anioTexto = '', mesTexto = '', diaTexto = ''] = fechaIso.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)) {
    return false;
  }

  const fechaValidacion = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaValidacion.getUTCFullYear() === anio &&
    fechaValidacion.getUTCMonth() === mes - 1 &&
    fechaValidacion.getUTCDate() === dia
  );
}

/**
 * Calcula la diferencia en días de calendario entre dos fechas ISO, ancladas al mediodía UTC-3.
 */
function diferenciaEnDias(fechaIso: string, fechaReferenciaIso: string): number {
  const instante = crearInstanteMediodiaClinica(fechaIso).getTime();
  const instanteReferencia = crearInstanteMediodiaClinica(fechaReferenciaIso).getTime();

  return Math.round((instante - instanteReferencia) / MILISEGUNDOS_POR_DIA);
}

/**
 * Construye el modelo de un día reservable a partir de su fecha local ISO.
 * Retorna null si la fecha no es válida o si cae sábado o domingo.
 */
export function construirDiaReservable(fechaIso: string, hoyIso?: string): DiaReservable | null {
  if (!esFechaCalendarioValida(fechaIso)) {
    return null;
  }

  const fechaDate = crearInstanteMediodiaClinica(fechaIso);
  const numeroDiaSemana = fechaDate.getUTCDay();

  if (numeroDiaSemana === DOMINGO || numeroDiaSemana === SABADO) {
    return null;
  }

  const [, mes = '', dia = ''] = fechaIso.split('-');
  const hoy = hoyIso ?? obtenerFechaLocalIso(new Date());

  return {
    fechaIso,
    fechaDate,
    diaSemanaCorto: DIAS_SEMANA_CORTOS[numeroDiaSemana] ?? '',
    numeroDia: dia,
    mesCorto: MESES_CORTOS[Number(mes) - 1] ?? '',
    etiquetaCompleta: formatearFechaLargaReserva(fechaIso),
    esHoy: fechaIso === hoy,
  };
}

/**
 * Obtiene la ventana de reserva vigente: desde hoy hasta 30 días después, inclusive.
 * Sólo se incluyen los días hábiles (lunes a viernes) como días reservables.
 */
export function obtenerRangoFechasReserva(ahora: Date = new Date()): RangoFechasReserva {
  const hoyIso = obtenerFechaLocalIso(ahora);
  const fechaMinima = crearInstanteMediodiaClinica(hoyIso);
  const fechaMaxima = new Date(fechaMinima.getTime() + DIAS_MAXIMOS_RESERVA * MILISEGUNDOS_POR_DIA);

  const diasHabiles: DiaReservable[] = [];

  for (let desplazamiento = 0; desplazamiento <= DIAS_MAXIMOS_RESERVA; desplazamiento += 1) {
    const fechaCandidata = new Date(fechaMinima.getTime() + desplazamiento * MILISEGUNDOS_POR_DIA);
    const fechaCandidataIso = obtenerFechaLocalIso(fechaCandidata);
    const dia = construirDiaReservable(fechaCandidataIso, hoyIso);

    if (dia) {
      diasHabiles.push(dia);
    }
  }

  return { fechaMinima, fechaMaxima, diasHabiles };
}

/**
 * Determina si una fecha ISO puede reservarse: formato y calendario válidos,
 * día hábil y dentro de la ventana de 30 días desde hoy.
 */
export function esFechaReservableValida(fechaIso: string, ahora: Date = new Date()): boolean {
  const hoyIso = obtenerFechaLocalIso(ahora);

  if (!hoyIso || !construirDiaReservable(fechaIso, hoyIso)) {
    return false;
  }

  const diasDeDiferencia = diferenciaEnDias(fechaIso, hoyIso);

  return diasDeDiferencia >= 0 && diasDeDiferencia <= DIAS_MAXIMOS_RESERVA;
}

/**
 * Formatea el rango horario de una reserva como 'HH:MM a HH:MM hs'.
 * Retorna cadena vacía si la fecha/hora recibida no es válida.
 */
export function formatearRangoHorarioReserva(fechaHoraIso: string): string {
  const horaInicio = extraerHoraClinica(fechaHoraIso);

  if (!horaInicio) {
    return '';
  }

  const horaFin = sumarUnaHora(horaInicio);

  return `${horaInicio} a ${horaFin} hs`;
}

/**
 * Formatea una fecha ISO local como 'Lunes 19/10/2026'.
 * Retorna cadena vacía si la fecha no es válida.
 */
export function formatearFechaLargaReserva(fechaIso: string): string {
  if (!esFechaCalendarioValida(fechaIso)) {
    return '';
  }

  return formatearFechaLargaClinica(crearInstanteMediodiaClinica(fechaIso));
}
