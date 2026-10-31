import type { RolUsuario } from '../auth/rol-usuario';
import { RUTAS, type RutaApp } from '../constantes/rutas';

export interface ItemNavegacion {
  readonly etiqueta: string;
  readonly ruta: RutaApp;
  readonly icono: string;
  readonly exacto: boolean;
}

export const ETIQUETA_ROL: Readonly<Record<RolUsuario, string>> = {
  PACIENTE: 'Paciente',
  MEDICO: 'Médico',
  ADMINISTRADOR: 'Administrador',
};

export const NAVEGACION_POR_ROL: Readonly<Record<RolUsuario, readonly ItemNavegacion[]>> = {
  PACIENTE: [
    {
      etiqueta: 'Mis Turnos',
      ruta: RUTAS.MIS_TURNOS,
      icono: 'pi pi-calendar',
      exacto: false,
    },
    {
      etiqueta: 'Reservar',
      ruta: RUTAS.TURNOS_NUEVO,
      icono: 'pi pi-calendar-plus',
      exacto: true,
    },
  ],
  MEDICO: [
    {
      etiqueta: 'Mi Agenda',
      ruta: RUTAS.AGENDA,
      icono: 'pi pi-calendar-clock',
      exacto: false,
    },
  ],
  ADMINISTRADOR: [
    {
      etiqueta: 'Turnos',
      ruta: RUTAS.TURNOS_ADMIN,
      icono: 'pi pi-table',
      exacto: true,
    },
    {
      etiqueta: 'Nueva Reserva',
      ruta: RUTAS.RESERVA_ADMIN,
      icono: 'pi pi-calendar-plus',
      exacto: true,
    },
    {
      etiqueta: 'Médicos',
      ruta: RUTAS.GESTION_MEDICOS,
      icono: 'pi pi-id-card',
      exacto: false,
    },
  ],
};

export function obtenerItemsNavegacion(
  rol: RolUsuario | null | undefined,
): readonly ItemNavegacion[] {
  if (!rol || !(rol in NAVEGACION_POR_ROL)) {
    return [];
  }
  return NAVEGACION_POR_ROL[rol];
}

export function mostrarBarraInferiorPorRol(rol: RolUsuario | null | undefined): boolean {
  return obtenerItemsNavegacion(rol).length > 1;
}

export function obtenerEtiquetaRol(rol: RolUsuario | null | undefined): string {
  if (!rol || !(rol in ETIQUETA_ROL)) {
    return '';
  }
  return ETIQUETA_ROL[rol];
}
