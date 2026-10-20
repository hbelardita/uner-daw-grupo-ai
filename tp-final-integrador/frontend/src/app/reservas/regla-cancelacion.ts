import type { RolUsuario } from '../auth/rol-usuario';
import {
  crearInstanteMediodiaClinica,
  esMismaFechaLocal,
  obtenerFechaLocalIso,
  OFFSET_CLINICA,
} from '../shared/functions/fecha-clinica';
import type { EstadoReserva } from './reserva';

const MILISEGUNDOS_POR_DIA = 86_400_000;

export interface TurnoCancelable {
  estado: EstadoReserva;
  fechaHora: string;
}

/**
 * Disponibilidad del botón de cancelación administrativa, modelada como unión discriminada:
 * - 'oculta': el turno no admite cancelación desde la UI (estado distinto de 'ACTIVO' o fecha inválida).
 * - 'habilitada': el administrador puede cancelar el turno.
 * - 'deshabilitada': el botón se muestra inactivo con un motivo explicativo.
 */
export type DisponibilidadCancelacion =
  | { readonly tipo: 'oculta' }
  | { readonly tipo: 'habilitada' }
  | { readonly tipo: 'deshabilitada' };

/** Motivo mostrado cuando la consulta ya comenzó y por lo tanto no puede cancelarse. */
export const MOTIVO_CANCELACION_INICIADA = 'No se puede cancelar: la consulta ya comenzó.';

/**
 * Calcula el instante límite de las 23:59:59.000 en la zona horaria de Argentina (UTC-3).
 */
function obtenerFinDelDiaUtc3(fecha: Date): Date {
  const fechaLocalIso = obtenerFechaLocalIso(fecha);
  return new Date(`${fechaLocalIso}T23:59:59.000${OFFSET_CLINICA}`);
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
 * Evalúa la disponibilidad del botón de cancelación para el rol ADMINISTRADOR:
 * - Estado distinto de 'ACTIVO' o 'fechaHora' no interpretable: 'oculta'.
 * - Cancelable según las reglas de dominio: 'habilitada'.
 * - Resto de los casos: 'deshabilitada' (el motivo se explica en la UI con `MOTIVO_CANCELACION_INICIADA`).
 * La comparación temporal se delega en `puedeCancelar` para no duplicar la regla.
 */
export function evaluarCancelacionAdministrativa(
  reserva: TurnoCancelable,
  ahora: Date,
): DisponibilidadCancelacion {
  if (reserva.estado !== 'ACTIVO') {
    return { tipo: 'oculta' };
  }

  const fechaTurno = new Date(reserva.fechaHora);
  if (Number.isNaN(fechaTurno.getTime())) {
    return { tipo: 'oculta' };
  }

  if (puedeCancelar(reserva, 'ADMINISTRADOR', ahora)) {
    return { tipo: 'habilitada' };
  }

  return { tipo: 'deshabilitada' };
}

/**
 * día de calendario local hasta el cual el paciente puede cancelar sin cargo.
 * Es el día anterior al del turno. Devuelve 'YYYY-MM-DD' o '' si el turno no es interpretable.
 */
export function obtenerDiaLimiteCancelacionSinCargo(fechaHoraIso: string): string {
  const instanteTurno = new Date(fechaHoraIso);

  if (Number.isNaN(instanteTurno.getTime())) {
    return '';
  }

  const diaTurno = obtenerFechaLocalIso(instanteTurno);

  if (!diaTurno) {
    return '';
  }

  const instanteDiaAnterior = new Date(
    crearInstanteMediodiaClinica(diaTurno).getTime() - MILISEGUNDOS_POR_DIA,
  );

  return obtenerFechaLocalIso(instanteDiaAnterior);
}

/**
 * Determina de  si una reserva corresponde al día de hoy en la zona horaria de Argentina (UTC-3).
 */
export function esTurnoDeHoy(reserva: TurnoCancelable, ahora: Date): boolean {
  const fechaTurno = new Date(reserva.fechaHora);
  if (Number.isNaN(fechaTurno.getTime())) {
    return false;
  }

  return esMismaFechaLocal(fechaTurno, ahora);
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
