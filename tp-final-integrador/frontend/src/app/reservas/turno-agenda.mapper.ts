import { extraerHoraClinica, sumarUnaHora } from '../shared/functions/fecha-clinica';
import type { TurnoMedicoResponse } from './reservas-dto';
import { HORAS_JORNADA_MEDICA, type FranjaHorariaAgenda, type TurnoAgenda } from './turno-agenda';

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

export function construirFranjasAgenda(turnos: readonly TurnoAgenda[]): FranjaHorariaAgenda[] {
  const turnosPorHora = new Map<string, TurnoAgenda>();

  for (const turno of turnos) {
    if (turno.estado === 'CANCELADO') {
      continue;
    }
    const hora = extraerHoraClinica(turno.fechaHora);
    if (hora && !turnosPorHora.has(hora)) {
      turnosPorHora.set(hora, turno);
    }
  }

  return HORAS_JORNADA_MEDICA.map((horaInicio): FranjaHorariaAgenda => {
    const horaFin = sumarUnaHora(horaInicio);
    const etiquetaHorario = `${horaInicio} : ${horaFin} hs`;
    const turno = turnosPorHora.get(horaInicio);

    if (turno) {
      return {
        tipo: 'OCUPADA',
        horaInicio,
        horaFin,
        etiquetaHorario,
        turno,
      };
    }

    return {
      tipo: 'LIBRE',
      horaInicio,
      horaFin,
      etiquetaHorario,
    };
  });
}
