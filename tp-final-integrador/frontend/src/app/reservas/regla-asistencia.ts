import type { EstadoReserva } from './reserva';

export interface TurnoAsistenciaTarget {
  estado: EstadoReserva;
  fechaHora: string;
}

/**
 * Determina  si un médico puede registrar asistencia (Atendido o Ausente) para un turno:
 * - El turno debe encontrarse en estado 'ACTIVO'.
 * - La fecha/hora de inicio del turno debe haber sido alcanzada o superada por la hora actual (ahora >= fechaHora).
 */
export function puedeRegistrarAsistencia(turno: TurnoAsistenciaTarget, ahora: Date): boolean {
  if (turno.estado !== 'ACTIVO') {
    return false;
  }

  const fechaTurno = new Date(turno.fechaHora);
  if (Number.isNaN(fechaTurno.getTime())) {
    return false;
  }

  return ahora.getTime() >= fechaTurno.getTime();
}
