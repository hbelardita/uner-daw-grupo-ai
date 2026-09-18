import { describe, it, expect } from 'vitest';
import { EstadoReserva } from './estado-reserva.enum.js';

describe('EstadoReserva enum', () => {
  it('debe contener exactamente los cuatro estados válidos del sistema', () => {
    const values = Object.values(EstadoReserva);
    expect(values).toHaveLength(4);
    expect(values).toEqual(
      expect.arrayContaining(['ACTIVO', 'ATENDIDO', 'AUSENTE', 'CANCELADO']),
    );
  });

  it('debe tener los valores string esperados para cada clave', () => {
    expect(EstadoReserva.ACTIVO).toBe('ACTIVO');
    expect(EstadoReserva.ATENDIDO).toBe('ATENDIDO');
    expect(EstadoReserva.AUSENTE).toBe('AUSENTE');
    expect(EstadoReserva.CANCELADO).toBe('CANCELADO');
  });
});
