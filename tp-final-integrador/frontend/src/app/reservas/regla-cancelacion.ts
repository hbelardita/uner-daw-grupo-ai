import type { RolUsuario } from '../auth/rol-usuario';
import type { Reserva } from './reserva';

const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';

/**
 * Calcula el instante límite de las 23:59:59.000 en la zona horaria de Argentina (UTC-3).
 */
function obtenerFinDelDiaUtc3(fecha: Date): Date {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const fechaLocalIso = formateador.format(fecha);
  return new Date(`${fechaLocalIso}T23:59:59.000-03:00`);
}

/**
 * Determina de forma pura si una reserva puede ser cancelada según las reglas de dominio:
 * - La reserva debe encontrarse en estado 'ACTIVO'.
 * - PACIENTE: sólo puede cancelar si el turno es estrictamente posterior a las 23:59:59 del día local actual (UTC-3).
 * - ADMINISTRADOR: puede cancelar siempre que la consulta no haya iniciado aún (fechaHora > ahora).
 * - MEDICO / Otros: no permitido (false).
 */
export function puedeCancelar(reserva: Reserva, rol: RolUsuario, ahora: Date): boolean {
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
