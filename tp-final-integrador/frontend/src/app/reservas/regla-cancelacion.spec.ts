import { describe, expect, it } from 'vitest';
import {
  debeMostrarCancelacionDeshabilitada,
  esTurnoDeHoy,
  puedeCancelar,
  type TurnoCancelable,
} from './regla-cancelacion';

describe('regla-cancelacion domain functions', () => {
  const ahora = new Date('2026-10-11T15:00:00.000-03:00');

  const baseTurno: TurnoCancelable = {
    fechaHora: '2026-10-12T10:00:00.000-03:00',
    estado: 'ACTIVO',
  };

  describe('esTurnoDeHoy', () => {
    it('retorna true si el turno es del mismo día en UTC-3', () => {
      const turnoHoy: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-11T09:00:00.000-03:00',
      };
      expect(esTurnoDeHoy(turnoHoy, ahora)).toBe(true);
    });

    it('retorna false si el turno fue ayer o en días previos', () => {
      const turnoAyer: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-10T18:00:00.000-03:00',
      };
      expect(esTurnoDeHoy(turnoAyer, ahora)).toBe(false);
    });

    it('retorna false si el turno es mañana o posterior', () => {
      const turnoManana: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-12T09:00:00.000-03:00',
      };
      expect(esTurnoDeHoy(turnoManana, ahora)).toBe(false);
    });

    it('retorna false para fechas inválidas', () => {
      const turnoInvalido: TurnoCancelable = { ...baseTurno, fechaHora: 'fecha-invalida' };
      expect(esTurnoDeHoy(turnoInvalido, ahora)).toBe(false);
    });
  });

  describe('puedeCancelar (PACIENTE)', () => {
    it('permite cancelar si el turno es posterior al fin del día de hoy', () => {
      const turnoFuturo: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-12T08:00:00.000-03:00',
      };
      expect(puedeCancelar(turnoFuturo, 'PACIENTE', ahora)).toBe(true);
    });

    it('no permite cancelar turnos del día de hoy', () => {
      const turnoHoy: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-11T18:00:00.000-03:00',
      };
      expect(puedeCancelar(turnoHoy, 'PACIENTE', ahora)).toBe(false);
    });

    it('no permite cancelar si el estado no es ACTIVO', () => {
      const turnoCancelado: TurnoCancelable = { ...baseTurno, estado: 'CANCELADO' };
      expect(puedeCancelar(turnoCancelado, 'PACIENTE', ahora)).toBe(false);
    });
  });

  describe('debeMostrarCancelacionDeshabilitada', () => {
    it('retorna true para turnos ACTIVOS del día de hoy que no pueden cancelarse', () => {
      const turnoHoy: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-11T16:00:00.000-03:00',
      };
      expect(debeMostrarCancelacionDeshabilitada(turnoHoy, 'PACIENTE', ahora)).toBe(true);
    });

    it('retorna false para turnos ACTIVOS pasados (anteriores a hoy)', () => {
      const turnoPasado: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-08T10:00:00.000-03:00',
      };
      expect(debeMostrarCancelacionDeshabilitada(turnoPasado, 'PACIENTE', ahora)).toBe(false);
    });

    it('retorna false para turnos futuros que sí son cancelables', () => {
      const turnoFuturo: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-15T10:00:00.000-03:00',
      };
      expect(debeMostrarCancelacionDeshabilitada(turnoFuturo, 'PACIENTE', ahora)).toBe(false);
    });

    it('retorna false para turnos que no están en estado ACTIVO', () => {
      const turnoHoyCancelado: TurnoCancelable = {
        ...baseTurno,
        fechaHora: '2026-10-11T10:00:00.000-03:00',
        estado: 'CANCELADO',
      };
      expect(debeMostrarCancelacionDeshabilitada(turnoHoyCancelado, 'PACIENTE', ahora)).toBe(false);
    });
  });
});
