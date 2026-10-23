/**
 * Helpers para escribir fixtures temporales en la zona de la clínica y
 * persistirlos con el contrato UTC que usa la columna `reservas.fecha_hora`
 * (`timestamp` sin zona, siempre en UTC).
 */

export const ZONA_HORARIA_CLINICA = 'America/Argentina/Buenos_Aires';

/** Argentina no aplica horario de verano: el offset es fijo. */
export const OFFSET_CLINICA = '-03:00';

const formateadorFechaIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha de calendario `YYYY-MM-DD` de la clínica para un instante dado. */
export function fechaCalendarioClinica(instante: Date): string {
  return formateadorFechaIso.format(instante);
}

/** Fecha de calendario de la clínica desplazada `dias` respecto de ahora. */
export function fechaCalendarioClinicaConDesplazamiento(dias: number): string {
  return fechaCalendarioClinica(new Date(Date.now() + dias * 86_400_000));
}

/**
 * Convierte una fecha de calendario y una hora de la clínica al string naive
 * UTC que se persiste en `reservas.fecha_hora`. Por ejemplo, las 10:00 de
 * Argentina del 20/11/2026 se guardan como `2026-11-20 13:00:00`.
 */
export function fechaHoraUtcNaive(
  fechaIso: string,
  horaClinica: number,
): string {
  const hora = String(horaClinica).padStart(2, '0');
  const instante = new Date(`${fechaIso}T${hora}:00:00${OFFSET_CLINICA}`);

  return instante.toISOString().slice(0, 19).replace('T', ' ');
}
