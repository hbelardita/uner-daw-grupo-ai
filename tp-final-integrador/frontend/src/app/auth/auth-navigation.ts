import { RUTAS } from '../constantes/rutas';
import type { RolUsuario } from './rol-usuario';

export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  PACIENTE: RUTAS.MIS_TURNOS,
  MEDICO: RUTAS.AGENDA,
  ADMINISTRADOR: RUTAS.TURNOS_ADMIN,
};

export function obtenerRutaInicioPorRol(rol: RolUsuario | null | undefined): string {
  if (!rol || !(rol in RUTA_INICIO_POR_ROL)) {
    return RUTAS.LOGIN;
  }
  return RUTA_INICIO_POR_ROL[rol];
}
