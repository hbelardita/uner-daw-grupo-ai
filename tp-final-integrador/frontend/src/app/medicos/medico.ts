export interface MedicoListItem {
  id: number;
  matricula: number;
  valorConsulta: number;
  nombres: string;
  apellidos: string;
}

export interface ActualizarValorConsultaRequest {
  valorConsulta: number;
}

export interface DisponibilidadSlot {
  fechaHora: string;
  disponible: boolean;
}
