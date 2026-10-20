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

export interface CrearReservaResponse {
  id: number;
  idMedico: number;
  idPaciente: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
}

export interface PacienteAdminResponse {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
}

export interface ReservaAdminResponse {
  id: number;
  fechaHora: string;
  estado: EstadoReserva;
  valorConsulta: number;
  medico: MedicoHistorialResponse;
  paciente: PacienteAdminResponse;
}

export interface MetaPaginacion {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ReservasAdminPaginadasResponse {
  data: ReservaAdminResponse[];
  meta: MetaPaginacion;
}

export const CAMPOS_ORDEN_RESERVAS_ADMIN = [
  'fechaHora',
  'paciente',
  'medico',
  'valorConsulta',
  'estado',
] as const;

export type CampoOrdenReservasAdmin = (typeof CAMPOS_ORDEN_RESERVAS_ADMIN)[number];
export type DireccionOrden = 'ASC' | 'DESC';

export interface FiltrosReservasAdmin {
  fechaDesde?: string;
  fechaHasta?: string;
  idMedico?: number;
  busquedaPaciente?: string;
  estado?: EstadoReserva[];
  pagina?: number;
  limite?: number;
  ordenarPor?: CampoOrdenReservasAdmin;
  direccion?: DireccionOrden;
}
