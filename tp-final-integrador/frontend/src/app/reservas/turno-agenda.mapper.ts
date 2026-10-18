import type { TurnoMedicoResponse } from './reservas-dto';
import {
  HORAS_JORNADA_MEDICA,
  type FranjaHorariaAgenda,
  type HoraJornada,
  type TurnoAgenda,
} from './turno-agenda';

const ZONA_HORARIA_CLINICA = 'America/Argentina/Buenos_Aires';

const formateadorHoraLocal = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA_CLINICA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function extraerHoraClinica(fechaHora: string): string {
  const tieneOffset = fechaHora.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(fechaHora);
  const fechaIso = tieneOffset ? fechaHora : `${fechaHora}-03:00`;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const partes = formateadorHoraLocal.formatToParts(fecha);
  const horaParte = partes.find((p) => p.type === 'hour')?.value ?? '00';
  const minutoParte = partes.find((p) => p.type === 'minute')?.value ?? '00';
  const horaNormalizada = horaParte === '24' ? '00' : horaParte.padStart(2, '0');

  return `${horaNormalizada}:${minutoParte.padStart(2, '0')}`;
}

function calcularHoraFin(horaInicio: HoraJornada): string {
  const horaNum = parseInt(horaInicio.slice(0, 2), 10);
  const horaFinNum = horaNum + 1;
  return `${String(horaFinNum).padStart(2, '0')}:00`;
}

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
    const horaFin = calcularHoraFin(horaInicio);
    const etiquetaHorario = `${horaInicio} \u2013 ${horaFin} hs`;
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
