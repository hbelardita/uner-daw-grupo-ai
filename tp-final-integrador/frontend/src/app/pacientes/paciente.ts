/** Paciente registrado, con los campos que expone `GET /api/v1/pacientes`. */
export interface PacienteResumen {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
}
