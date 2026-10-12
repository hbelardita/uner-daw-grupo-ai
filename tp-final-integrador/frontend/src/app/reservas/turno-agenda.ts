import type { EstadoReserva, PacienteResumen } from './reserva';

export type PacienteTurnoAgenda = PacienteResumen;

export interface TurnoAgenda {
  id: number;
  fechaHora: string;
  estado: EstadoReserva;
  paciente: PacienteResumen;
}
