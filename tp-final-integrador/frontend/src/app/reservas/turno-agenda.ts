import type { EstadoReserva, PacienteResumen } from './reserva';

export type PacienteTurnoAgenda = PacienteResumen;

export interface TurnoAgenda {
  id: number;
  fechaHora: string;
  estado: EstadoReserva;
  paciente: PacienteResumen;
}

export const HORAS_JORNADA_MEDICA = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
] as const;

export type HoraJornada = (typeof HORAS_JORNADA_MEDICA)[number];

export interface FranjaLibre {
  readonly tipo: 'LIBRE';
  readonly horaInicio: HoraJornada;
  readonly horaFin: string;
  readonly etiquetaHorario: string;
}

export interface FranjaOcupada {
  readonly tipo: 'OCUPADA';
  readonly horaInicio: HoraJornada;
  readonly horaFin: string;
  readonly etiquetaHorario: string;
  readonly turno: TurnoAgenda;
}

export type FranjaHorariaAgenda = FranjaLibre | FranjaOcupada;
