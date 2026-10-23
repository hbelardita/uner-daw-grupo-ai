/**
 * Contrato de persistencia temporal: `reservas.fecha_hora` es una columna
 * `timestamp` (sin zona) y el driver de PostgreSQL serializa los `Date`
 * usando los componentes de hora local del proceso.
 *
 * Fijar el proceso en UTC garantiza que todo lo que se persiste sea el
 * instante UTC y que el resultado no dependa del huso horario del host
 * (desarrollo en UTC-3, CI o contenedores en UTC).
 *
 * La proyección a la zona de la clínica se hace explícitamente al leer o
 * evaluar reglas de negocio, nunca al almacenar.
 */
export const ZONA_HORARIA_PROCESO = 'UTC';

export function configurarZonaHorariaUtc(): void {
  process.env.TZ = ZONA_HORARIA_PROCESO;
}
