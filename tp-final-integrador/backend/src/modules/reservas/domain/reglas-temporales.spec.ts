import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  diferenciaDiasCalendario,
  esFinDeSemana,
  estaDentroDeLaVentanaDeAtencion,
  generarSlotsDelDia,
  obtenerPartesLocales,
  parsearYValidarFechaCalendario,
  validarAntelacionCancelacion,
  validarReglasCreacionReserva,
} from './reglas-temporales.js';

describe('reglas-temporales - funciones puras de dominio', () => {
  const ahoraBase = new Date('2026-10-05T13:00:00.000Z');

  describe('obtenerPartesLocales', () => {
    it('debe convertir un instante UTC a las partes locales en America/Argentina/Buenos_Aires', () => {
      // 2026-10-12 11:00 UTC = 2026-10-12 08:00 AR (UTC-3)
      const partes = obtenerPartesLocales(new Date('2026-10-12T11:00:00.000Z'));
      expect(partes).toEqual({
        anio: 2026,
        mes: 10,
        dia: 12,
        hora: 8,
        minuto: 0,
      });
    });
  });

  describe('esFinDeSemana', () => {
    it('debe identificar sábado y domingo como fin de semana', () => {
      // 2026-10-10 es sábado, 2026-10-11 es domingo, 2026-10-12 es lunes
      expect(
        esFinDeSemana({ anio: 2026, mes: 10, dia: 10, hora: 10, minuto: 0 }),
      ).toBe(true);
      expect(
        esFinDeSemana({ anio: 2026, mes: 10, dia: 11, hora: 10, minuto: 0 }),
      ).toBe(true);
      expect(
        esFinDeSemana({ anio: 2026, mes: 10, dia: 12, hora: 10, minuto: 0 }),
      ).toBe(false);
    });
  });

  describe('estaDentroDeLaVentanaDeAtencion', () => {
    it('debe aceptar horarios entre 08:00 y 15:00 en punto', () => {
      expect(
        estaDentroDeLaVentanaDeAtencion({
          anio: 2026,
          mes: 10,
          dia: 12,
          hora: 8,
          minuto: 0,
        }),
      ).toBe(true);
      expect(
        estaDentroDeLaVentanaDeAtencion({
          anio: 2026,
          mes: 10,
          dia: 12,
          hora: 15,
          minuto: 0,
        }),
      ).toBe(true);
    });

    it('debe rechazar horarios con minutos distintos de cero o fuera del rango 8-15', () => {
      expect(
        estaDentroDeLaVentanaDeAtencion({
          anio: 2026,
          mes: 10,
          dia: 12,
          hora: 7,
          minuto: 0,
        }),
      ).toBe(false);
      expect(
        estaDentroDeLaVentanaDeAtencion({
          anio: 2026,
          mes: 10,
          dia: 12,
          hora: 16,
          minuto: 0,
        }),
      ).toBe(false);
      expect(
        estaDentroDeLaVentanaDeAtencion({
          anio: 2026,
          mes: 10,
          dia: 12,
          hora: 10,
          minuto: 30,
        }),
      ).toBe(false);
    });
  });

  describe('diferenciaDiasCalendario', () => {
    it('debe calcular la diferencia exacta en días de calendario', () => {
      const desde = { anio: 2026, mes: 10, dia: 5, hora: 23, minuto: 59 };
      const hasta = { anio: 2026, mes: 10, dia: 6, hora: 0, minuto: 1 };
      expect(diferenciaDiasCalendario(desde, hasta)).toBe(1);
    });
  });

  describe('validarReglasCreacionReserva', () => {
    it('debe validar un turno válido', () => {
      expect(() =>
        validarReglasCreacionReserva(
          new Date('2026-10-12T11:00:00.000Z'),
          ahoraBase,
        ),
      ).not.toThrow();
    });

    it('debe rechazar un turno en fin de semana', () => {
      expect(() =>
        validarReglasCreacionReserva(
          new Date('2026-10-10T13:00:00.000Z'),
          ahoraBase,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('validarAntelacionCancelacion', () => {
    it('debe permitir cancelar con 1 o más días de anticipación', () => {
      const turno = new Date('2026-10-12T11:00:00.000Z');
      const ahora = new Date('2026-10-11T20:00:00.000Z');
      expect(() => validarAntelacionCancelacion(turno, ahora)).not.toThrow();
    });

    it('debe rechazar cancelar el mismo día de la fecha local del turno', () => {
      const turno = new Date('2026-10-12T11:00:00.000Z');
      const ahora = new Date('2026-10-12T03:00:00.000Z');
      expect(() => validarAntelacionCancelacion(turno, ahora)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parsearYValidarFechaCalendario', () => {
    it('debe parsear una fecha válida y retornar PartesLocales con hora y minuto en cero', () => {
      const partes = parsearYValidarFechaCalendario('2026-10-15');
      expect(partes).toEqual({
        anio: 2026,
        mes: 10,
        dia: 15,
        hora: 0,
        minuto: 0,
      });
    });

    it('debe rechazar fechas imposibles en el calendario que desbordan mes (ej. 31 de febrero)', () => {
      expect(() => parsearYValidarFechaCalendario('2026-02-31')).toThrow(
        BadRequestException,
      );
      expect(() => parsearYValidarFechaCalendario('2026-04-31')).toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar strings con partes no enteras o formatos invalidos', () => {
      expect(() => parsearYValidarFechaCalendario('invalida')).toThrow(
        BadRequestException,
      );
      expect(() => parsearYValidarFechaCalendario('2026-13-40')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('generarSlotsDelDia', () => {
    it('debe generar exactamente 8 slots para las horas de 08:00 a 15:00 UTC-3', () => {
      const slots = generarSlotsDelDia('2026-10-15');
      expect(slots).toHaveLength(8);

      // Primer slot: 08:00 America/Argentina/Buenos_Aires = 11:00 UTC
      expect(slots[0]?.toISOString()).toBe('2026-10-15T11:00:00.000Z');

      // Ultimo slot: 15:00 America/Argentina/Buenos_Aires = 18:00 UTC
      expect(slots[7]?.toISOString()).toBe('2026-10-15T18:00:00.000Z');
    });
  });
});
