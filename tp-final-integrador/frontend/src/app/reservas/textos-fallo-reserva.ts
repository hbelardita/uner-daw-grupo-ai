import type { TextosFalloHttp } from '../shared/functions/fallo-http';

/** Mensajes de rechazo al confirmar una reserva, compartidos por las páginas de paciente y administrador. */
export const TEXTOS_FALLO_RESERVA: TextosFalloHttp = {
  desincronizado:
    'Ese horario acaba de ser reservado por otra persona. Actualizamos la disponibilidad para que elijas otro.',
  sinPermiso: 'No tenes permiso para reservar turnos.',
  generico: 'No pudimos confirmar la reserva. Por favor, reintentá.',
};
