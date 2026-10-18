import type { RolUsuario } from '../auth/rol-usuario';
import type { EstadoReserva } from './reserva';

export interface TurnoCancelable {
  estado: EstadoReserva;
  fechaHora: string;
}

const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';

/**
 * Obtiene la representación de fecha local 'YYYY-MM-DD' en la zona horaria de Argentina (UTC-3).
 */
export function obtenerFechaLocalIso(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formateador.format(fecha);
}

/**
 * Calcula el instante límite de las 23:59:59.000 en la zona horaria de Argentina (UTC-3).
 */
function obtenerFinDelDiaUtc3(fecha: Date): Date {
  const fechaLocalIso = obtenerFechaLocalIso(fecha);
  return new Date(`${fechaLocalIso}T23:59:59.000-03:00`);
}

/**
 * Determina de forma pura si una reserva puede ser cancelada según las reglas de dominio:
 * - La reserva debe encontrarse en estado 'ACTIVO'.
 * - PACIENTE: sólo puede cancelar si el turno es estrictamente posterior a las 23:59:59 del día local actual (UTC-3).
 * - ADMINISTRADOR: puede cancelar siempre que la consulta no haya iniciado aún (fechaHora > ahora).
 * - MEDICO / Otros: no permitido (false).
 */
export function puedeCancelar(reserva: TurnoCancelable, rol: RolUsuario, ahora: Date): boolean {
  if (reserva.estado !== 'ACTIVO') {
    return false;
  }

  const fechaTurno = new Date(reserva.fechaHora);
  if (Number.isNaN(fechaTurno.getTime())) {
    return false;
  }

  if (rol === 'PACIENTE') {
    const finDelDiaActual = obtenerFinDelDiaUtc3(ahora);
    return fechaTurno.getTime() > finDelDiaActual.getTime();
  }

  if (rol === 'ADMINISTRADOR') {
    return fechaTurno.getTime() > ahora.getTime();
  }

  return false;
}

/**
 * Determina de  si una reserva corresponde al día de hoy en la zona horaria de Argentina (UTC-3).
 */
export function esTurnoDeHoy(reserva: TurnoCancelable, ahora: Date): boolean {
  const fechaTurno = new Date(reserva.fechaHora);
  if (Number.isNaN(fechaTurno.getTime())) {
    return false;
  }

  return obtenerFechaLocalIso(fechaTurno) === obtenerFechaLocalIso(ahora);
}

/**
 * Determina si debe mostrarse el botón de cancelación deshabilitado con motivo explicativo:
 * - La reserva debe encontrarse en estado 'ACTIVO'.
 * - No debe ser cancelable por las reglas vigentes.
 * - Debe ser un turno del día de hoy en UTC-3. Para turnos anteriores a hoy, ya ocurrieron y no se muestra botón.
 */
export function debeMostrarCancelacionDeshabilitada(
  reserva: TurnoCancelable,
  rol: RolUsuario,
  ahora: Date,
): boolean {
  if (reserva.estado !== 'ACTIVO') {
    return false;
  }

  if (puedeCancelar(reserva, rol, ahora)) {
    return false;
  }

  return esTurnoDeHoy(reserva, ahora);
}

export interface RespuestaFallida {
  status: number;
  cuerpo: unknown;
}

/**
 * Cancelación rechazada por el servidor.
 * 'desincronizado' exige recargar la lista local. 'reintentable' deja el turno como estaba.
 */
export type FalloCancelacion =
  { tipo: 'desincronizado'; mensaje: string } | { tipo: 'reintentable'; mensaje: string };

export function clasificarFalloCancelacion(respuesta: RespuestaFallida | null): FalloCancelacion {
  const mensajeDelServidor = extraerMensajeDeError(respuesta?.cuerpo);

  if (respuesta && (respuesta.status === 409 || respuesta.status === 404)) {
    return {
      tipo: 'desincronizado',
      mensaje: mensajeDelServidor ?? 'El turno cambió de estado. Actualizamos tu lista de turnos.',
    };
  }

  if (respuesta?.status === 403) {
    return {
      tipo: 'reintentable',
      mensaje: mensajeDelServidor ?? 'No tenés permiso para cancelar este turno.',
    };
  }

  return {
    tipo: 'reintentable',
    mensaje: 'No pudimos cancelar el turno. Por favor, reintentá.',
  };
}

function extraerMensajeDeError(cuerpo: unknown): string | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null;
  }
  const mensaje = (cuerpo as { message?: unknown }).message;
  return typeof mensaje === 'string' && mensaje.trim() !== '' ? mensaje : null;
}
