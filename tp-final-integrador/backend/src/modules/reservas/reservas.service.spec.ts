import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ReservasService } from './reservas.service.js';

// Todas las fechas se construyen como instantes UTC explícitos.
// La clínica opera en America/Argentina/Buenos_Aires (UTC-3, sin horario de verano).
// "ahora" de referencia: lunes 2026-10-05 10:00 hora local AR (13:00 UTC).
const AHORA_BASE = new Date('2026-10-05T13:00:00.000Z');

function validar(
  servicio: ReservasService,
  fechaHora: Date,
  ahora: Date = AHORA_BASE,
): void {
  servicio.validarReglasTemporales(fechaHora, ahora);
}

/**
 * Ejecuta la validación y devuelve la excepción lanzada, o `undefined` si no
 * lanzó ninguna. Las aserciones se hacen en el cuerpo de cada test.
 */
function capturarError(funcion: () => void): unknown {
  try {
    funcion();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe('ReservasService - Validación de reglas temporales del turno', () => {
  const servicio = new ReservasService();

  describe('Casos de éxito', () => {
    it('debe aceptar un turno un lunes a las 08:00 hora local AR', () => {
      // 2026-10-12 08:00 AR = 2026-10-12 11:00 UTC
      expect(() =>
        validar(servicio, new Date('2026-10-12T11:00:00.000Z')),
      ).not.toThrow();
    });

    it('debe aceptar un turno un miércoles a las 12:00 hora local AR', () => {
      // 2026-10-14 12:00 AR = 2026-10-14 15:00 UTC
      expect(() =>
        validar(servicio, new Date('2026-10-14T15:00:00.000Z')),
      ).not.toThrow();
    });

    it('debe aceptar un turno un viernes a las 15:00 hora local AR', () => {
      // 2026-10-16 15:00 AR = 2026-10-16 18:00 UTC
      expect(() =>
        validar(servicio, new Date('2026-10-16T18:00:00.000Z')),
      ).not.toThrow();
    });
  });

  describe('Errores esperados', () => {
    it('debe rechazar un turno en sábado con estado 400', () => {
      // 2026-10-10 es sábado
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-10T13:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'Los turnos sólo pueden agendarse de lunes a viernes.',
      );
    });

    it('debe rechazar un turno en domingo con estado 400', () => {
      // 2026-10-11 es domingo
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-11T13:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'Los turnos sólo pueden agendarse de lunes a viernes.',
      );
    });

    it('debe rechazar un turno a las 07:59 hora local AR con estado 400', () => {
      // 2026-10-12 07:59 AR = 2026-10-12 10:59 UTC
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-12T10:59:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe rechazar un turno a las 16:00 hora local AR con estado 400', () => {
      // 2026-10-12 16:00 AR = 2026-10-12 19:00 UTC
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-12T19:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe rechazar un turno en el pasado con estado 400', () => {
      // 2026-10-05 08:00 AR (11:00 UTC) es anterior a "ahora" (13:00 UTC)
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-05T11:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'No se pueden agendar turnos en el pasado.',
      );
    });

    it('debe rechazar un turno idéntico a "ahora" con estado 400', () => {
      const ahora = new Date('2026-10-05T11:00:00.000Z');
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-05T11:00:00.000Z'), ahora),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'No se pueden agendar turnos en el pasado.',
      );
    });

    it('debe rechazar un turno a 31 días con estado 400', () => {
      // "ahora" local: 2026-10-05; 2026-11-05 es día +31
      const error = capturarError(() =>
        validar(servicio, new Date('2026-11-05T11:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'Los turnos no pueden agendarse con más de 30 días de antelación.',
      );
    });

    it('debe rechazar una fecha inválida con estado 400', () => {
      const error = capturarError(() =>
        validar(servicio, new Date('no-es-una-fecha')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe('La fecha y hora del turno no es válida.');
    });
  });

  describe('Casos borde', () => {
    it('debe aceptar un turno exactamente a 30 días de antelación', () => {
      // "ahora": 2026-10-06 (martes) 10:00 AR; 2026-11-05 es día +30 (jueves)
      const ahora = new Date('2026-10-06T13:00:00.000Z');
      expect(() =>
        validar(servicio, new Date('2026-11-05T11:00:00.000Z'), ahora),
      ).not.toThrow();
    });

    it('debe rechazar un turno a 31 días desde otro instante de referencia', () => {
      // "ahora": 2026-10-06; 2026-11-06 es día +31 (viernes)
      const ahora = new Date('2026-10-06T13:00:00.000Z');
      const error = capturarError(() =>
        validar(servicio, new Date('2026-11-06T11:00:00.000Z'), ahora),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'Los turnos no pueden agendarse con más de 30 días de antelación.',
      );
    });

    it('debe rechazar la medianoche local (lunes 00:00 AR) por fuera de la ventana', () => {
      // 2026-10-12 00:00 AR = 2026-10-12 03:00 UTC
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-12T03:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe evaluar el fin de semana en hora local, no en UTC', () => {
      // 2026-10-12 02:00 UTC = 2026-10-11 23:00 AR (domingo local)
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-12T02:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'Los turnos sólo pueden agendarse de lunes a viernes.',
      );
    });

    it('debe rechazar 08:00 UTC porque son apenas 05:00 hora local AR', () => {
      // 2026-10-12 08:00 UTC = 2026-10-12 05:00 AR
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-12T08:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe aceptar 15:00 hora local AR equivalentes a 18:00 UTC', () => {
      expect(() =>
        validar(servicio, new Date('2026-10-16T18:00:00.000Z')),
      ).not.toThrow();
    });

    it('debe rechazar 16:00 hora local AR equivalentes a 19:00 UTC', () => {
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-16T19:00:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe rechazar minutos no exactos (10:30 hora local AR)', () => {
      // 2026-10-14 10:30 AR = 2026-10-14 13:30 UTC
      const error = capturarError(() =>
        validar(servicio, new Date('2026-10-14T13:30:00.000Z')),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      const excepcion = error as BadRequestException;
      expect(excepcion.getStatus()).toBe(400);
      expect(excepcion.message).toBe(
        'El inicio del turno debe estar entre las 08:00 y las 15:00 horas, en punto.',
      );
    });

    it('debe tolerar segundos y milisegundos no nulos en el inicio del turno si hora y minutos están en punto', () => {
      // 2026-10-14 12:00:15.500 AR = 2026-10-14 15:00:15.500 UTC
      expect(() =>
        validar(servicio, new Date('2026-10-14T15:00:15.500Z')),
      ).not.toThrow();
    });
  });
});
