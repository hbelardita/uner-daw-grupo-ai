export const RUTAS = {
  LOGIN: '/login',
  AGENDA: '/agenda',
  MIS_TURNOS: '/mis-turnos',
  TURNOS_ADMIN: '/turnos',
  TURNOS_NUEVA: '/turnos/nueva',
  GESTION_MEDICOS: '/gestion',
} as const;
export type RutaApp = (typeof RUTAS)[keyof typeof RUTAS];
