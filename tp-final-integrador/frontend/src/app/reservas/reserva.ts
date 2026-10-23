export type EstadoReserva = 'ACTIVO' | 'ATENDIDO' | 'AUSENTE' | 'CANCELADO';

export interface CrearReserva {
  idMedico: number;
  fechaHora: string;
  idPaciente?: number;
}

export const ESTADOS_ASISTENCIA = ['ATENDIDO', 'AUSENTE'] as const;
export type EstadoAsistencia = (typeof ESTADOS_ASISTENCIA)[number];

export interface ActualizarReservaEstado {
  estado: EstadoAsistencia;
}

export interface FiltroReservas {
  fecha?: Date | string;
  idMedico?: number;
  idPaciente?: number;
  estado?: EstadoReserva;
}
