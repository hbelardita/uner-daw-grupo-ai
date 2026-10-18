import type { RolUsuario } from '../auth/rol-usuario';
import { RUTAS } from '../constantes/rutas';

export interface AccionPrincipal {
  readonly label: string;
  readonly ruta: string;
  readonly icon: string;
}

export type TipoAccionError = 'volver' | 'ir';

interface DestinoRol {
  readonly destino: string;
  readonly ruta: string;
  readonly icon: string;
}

const DESTINOS_ROL: Record<RolUsuario, DestinoRol> = {
  PACIENTE: {
    destino: 'Mis Turnos',
    ruta: RUTAS.MIS_TURNOS,
    icon: 'pi pi-calendar',
  },
  MEDICO: {
    destino: 'Mi Agenda',
    ruta: RUTAS.AGENDA,
    icon: 'pi pi-calendar-clock',
  },
  ADMINISTRADOR: {
    destino: 'Turnos de la Clínica',
    ruta: RUTAS.TURNOS_ADMIN,
    icon: 'pi pi-table',
  },
};

export function resolverAccionPrincipalError(
  rol: RolUsuario | null | undefined,
  tipo: TipoAccionError,
): AccionPrincipal {
  if (rol && rol in DESTINOS_ROL) {
    const info = DESTINOS_ROL[rol];
    return {
      label: tipo === 'volver' ? `Volver a ${info.destino}` : `Ir a ${info.destino}`,
      ruta: info.ruta,
      icon: info.icon,
    };
  }

  return tipo === 'volver'
    ? {
        label: 'Volver al inicio',
        ruta: RUTAS.LOGIN,
        icon: 'pi pi-home',
      }
    : {
        label: 'Iniciar sesión',
        ruta: RUTAS.LOGIN,
        icon: 'pi pi-sign-in',
      };
}
