import type { EstadoReserva } from './reserva';

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
