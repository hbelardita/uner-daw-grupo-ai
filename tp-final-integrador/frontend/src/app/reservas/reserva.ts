export type EstadoReserva = 'ACTIVO' | 'ATENDIDO' | 'AUSENTE' | 'CANCELADO';

export interface ReservaMedico {
  id: number;
  nombres: string;
  apellidos: string;
  matricula: number;
}

export interface ReservaPaciente {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
}

export interface Reserva {
  id: number;
  idMedico: number;
  idPaciente: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
  medico: ReservaMedico;
  paciente: ReservaPaciente;
}

export interface CrearReserva {
  idMedico: number;
  fechaHora: string;
  idPaciente?: number;
}

export interface ActualizarReservaEstado {
  estado: 'ATENDIDO' | 'AUSENTE';
}

export interface PacienteAutocompleteItem {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
}
