import type { EstadoReserva } from './reserva';

export interface MedicoHistorialResponse {
  id: number;
  nombres: string;
  apellidos: string;
  matricula: number;
}

export interface HistorialReservaResponse {
  id: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
  medico: MedicoHistorialResponse;
}

export interface TurnoMedicoPacienteResponse {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface TurnoMedicoResponse {
  id: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
  paciente: TurnoMedicoPacienteResponse;
}

export interface CancelarReservaResponse {
  id: number;
  idMedico: number;
  idPaciente: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
}

export interface ActualizarReservaEstadoResponse {
  id: number;
  idMedico: number;
  idPaciente: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
}
