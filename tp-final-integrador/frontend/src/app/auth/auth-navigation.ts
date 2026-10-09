import type { RolUsuario } from './rol-usuario';

export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  PACIENTE: '/mis-turnos',
  MEDICO: '/agenda',
  ADMINISTRADOR: '/turnos',
};

export function obtenerRutaInicioPorRol(rol: RolUsuario | null | undefined): string {
  if (!rol || !(rol in RUTA_INICIO_POR_ROL)) {
    return '/login';
  }
  return RUTA_INICIO_POR_ROL[rol];
}
