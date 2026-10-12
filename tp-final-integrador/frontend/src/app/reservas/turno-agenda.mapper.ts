import type { TurnoMedicoResponse } from './reservas-dto';
import type { TurnoAgenda } from './turno-agenda';

export function mapearTurnoMedicoATurnoAgenda(dto: TurnoMedicoResponse): TurnoAgenda {
  return {
    id: dto.id,
    fechaHora: dto.fechaHora,
    estado: dto.estado,
    paciente: {
      id: dto.paciente.id,
      documento: dto.paciente.documento,
      nombres: dto.paciente.nombres,
      apellidos: dto.paciente.apellidos,
    },
  };
}

export function mapearTurnosMedicosATurnosAgenda(turnos: TurnoMedicoResponse[]): TurnoAgenda[] {
  return turnos.map(mapearTurnoMedicoATurnoAgenda);
}
