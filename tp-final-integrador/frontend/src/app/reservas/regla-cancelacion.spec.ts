import { describe, expect, it } from 'vitest';
import {
  debeMostrarCancelacionDeshabilitada,
  esTurnoDeHoy,
  puedeCancelar,
} from './regla-cancelacion';
import type { Reserva } from './reserva';

describe('regla-cancelacion domain functions', () => {
  const ahora = new Date('2026-10-11T15:00:00.000-03:00');

  const baseReserva: Reserva = {
    id: 1,
    idMedico: 1,
    idPaciente: 3,
    fechaHora: '2026-10-12T10:00:00.000-03:00',
    estado: 'ACTIVO',
    valorConsulta: 10000,
    medico: { id: 1, nombres: 'Carlos', apellidos: 'Gómez', matricula: 1234 },
    paciente: { id: 3, nombres: 'Juan', apellidos: 'Pérez', documento: '12345678' },
  };

  describe('esTurnoDeHoy', () => {
    it('retorna true si el turno es del mismo día en UTC-3', () => {
      const turnoHoy: Reserva = { ...baseReserva, fechaHora: '2026-10-11T09:00:00.000-03:00' };
      expect(esTurnoDeHoy(turnoHoy, ahora)).toBe(true);
    });

    it('retorna false si el turno fue ayer o en días previos', () => {
      const turnoAyer: Reserva = { ...baseReserva, fechaHora: '2026-10-10T18:00:00.000-03:00' };
      expect(esTurnoDeHoy(turnoAyer, ahora)).toBe(false);
    });

    it('retorna false si el turno es mañana o posterior', () => {
      const turnoManana: Reserva = { ...baseReserva, fechaHora: '2026-10-12T09:00:00.000-03:00' };
      expect(esTurnoDeHoy(turnoManana, ahora)).toBe(false);
    });

    it('retorna false para fechas inválidas', () => {
      const turnoInvalido: Reserva = { ...baseReserva, fechaHora: 'fecha-invalida' };
      expect(esTurnoDeHoy(turnoInvalido, ahora)).toBe(false);
    });
  });

  describe('puedeCancelar (PACIENTE)', () => {
    it('permite cancelar si el turno es posterior al fin del día de hoy', () => {
      const turnoFuturo: Reserva = { ...baseReserva, fechaHora: '2026-10-12T08:00:00.000-03:00' };
      expect(puedeCancelar(turnoFuturo, 'PACIENTE', ahora)).toBe(true);
    });

    it('no permite cancelar turnos del día de hoy', () => {
      const turnoHoy: Reserva = { ...baseReserva, fechaHora: '2026-10-11T18:00:00.000-03:00' };
      expect(puedeCancelar(turnoHoy, 'PACIENTE', ahora)).toBe(false);
    });

    it('no permite cancelar si el estado no es ACTIVO', () => {
      const turnoCancelado: Reserva = { ...baseReserva, estado: 'CANCELADO' };
      expect(puedeCancelar(turnoCancelado, 'PACIENTE', ahora)).toBe(false);
    });
  });

  describe('debeMostrarCancelacionDeshabilitada', () => {
    it('retorna true para turnos ACTIVOS del día de hoy que no pueden cancelarse', () => {
      const turnoHoy: Reserva = { ...baseReserva, fechaHora: '2026-10-11T16:00:00.000-03:00' };
      expect(debeMostrarCancelacionDeshabilitada(turnoHoy, 'PACIENTE', ahora)).toBe(true);
    });

    it('retorna false para turnos ACTIVOS pasados (anteriores a hoy)', () => {
      const turnoPasado: Reserva = { ...baseReserva, fechaHora: '2026-10-08T10:00:00.000-03:00' };
      expect(debeMostrarCancelacionDeshabilitada(turnoPasado, 'PACIENTE', ahora)).toBe(false);
    });

    it('retorna false para turnos futuros que sí son cancelables', () => {
      const turnoFuturo: Reserva = { ...baseReserva, fechaHora: '2026-10-15T10:00:00.000-03:00' };
      expect(debeMostrarCancelacionDeshabilitada(turnoFuturo, 'PACIENTE', ahora)).toBe(false);
    });

    it('retorna false para turnos que no están en estado ACTIVO', () => {
      const turnoHoyCancelado: Reserva = {
        ...baseReserva,
        fechaHora: '2026-10-11T10:00:00.000-03:00',
        estado: 'CANCELADO',
      };
      expect(debeMostrarCancelacionDeshabilitada(turnoHoyCancelado, 'PACIENTE', ahora)).toBe(false);
    });
  });
});
