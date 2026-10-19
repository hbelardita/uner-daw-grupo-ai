import { describe, expect, it } from 'vitest';
import { puedeRegistrarAsistencia, type TurnoAsistenciaTarget } from './regla-asistencia';

describe('puedeRegistrarAsistencia (RN-09)', () => {
  it('permite registrar asistencia cuando el turno está ACTIVO y ya inició', () => {
    const ahora = new Date('2026-10-18T10:30:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'ACTIVO',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(true);
  });

  it('permite registrar asistencia exactamente en el minuto de inicio del turno', () => {
    const ahora = new Date('2026-10-18T10:00:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'ACTIVO',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(true);
  });

  it('no permite registrar asistencia si la hora del turno aún no llegó', () => {
    const ahora = new Date('2026-10-18T09:59:59-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'ACTIVO',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(false);
  });

  it('no permite registrar asistencia si el turno ya fue ATENDIDO', () => {
    const ahora = new Date('2026-10-18T11:00:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'ATENDIDO',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(false);
  });

  it('no permite registrar asistencia si el turno fue marcado como AUSENTE', () => {
    const ahora = new Date('2026-10-18T11:00:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'AUSENTE',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(false);
  });

  it('no permite registrar asistencia si el turno está CANCELADO', () => {
    const ahora = new Date('2026-10-18T11:00:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'CANCELADO',
      fechaHora: '2026-10-18T10:00:00-03:00',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(false);
  });

  it('retorna false si la fechaHora es inválida', () => {
    const ahora = new Date('2026-10-18T11:00:00-03:00');
    const turno: TurnoAsistenciaTarget = {
      estado: 'ACTIVO',
      fechaHora: 'fecha-invalida',
    };

    expect(puedeRegistrarAsistencia(turno, ahora)).toBe(false);
  });
});
