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

/** Información resumida de un paciente reutilizada en autocompletes, tablas y agendas */
export interface PacienteResumen {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
}

export type PacienteAutocompleteItem = PacienteResumen;

export interface FiltroReservas {
  fecha?: Date | string;
  idMedico?: number;
  idPaciente?: number;
  estado?: EstadoReserva;
}
