import { Component, inject } from '@angular/core';
import { type RedirectFunction, type Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth';
import { obtenerRutaInicioPorRol } from './auth/auth-navigation';
import { AuthService } from './auth/auth-service';
import { SEGMENTOS_RUTA } from './constantes/rutas';

@Component({
  selector: 'app-turno-medico-detalle',
  imports: [],
  template: '<p>Detalle de Turno Médico</p>',
})
export class TurnoMedicoDetalleComponent {}

@Component({
  selector: 'app-mi-turno-detalle',
  imports: [],
  template: '<p>Detalle Mi Turno</p>',
})
export class MiTurnoDetalleComponent {}

@Component({
  selector: 'app-turno-admin-detalle',
  imports: [],
  template: '<p>Detalle de Turno (Admin)</p>',
})
export class TurnoAdminDetalleComponent {}

export const resolverRutaInicio: RedirectFunction = () => {
  const auth = inject(AuthService);
  return obtenerRutaInicioPorRol(auth.rol());
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: resolverRutaInicio,
  },
  {
    path: SEGMENTOS_RUTA.LOGIN,
    title: 'Inicio de Sesión',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login-page/login-page'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/private-layout'),
    children: [
      {
        path: SEGMENTOS_RUTA.AGENDA,
        title: 'Mi Agenda',
        canActivate: [roleGuard(['MEDICO'])],
        children: [
          {
            path: '',
            loadComponent: () => import('./reservas/agenda-diaria/agenda-diaria'),
          },
          {
            path: `${SEGMENTOS_RUTA.TURNOS}/:id`,
            title: 'Detalle del Turno',
            component: TurnoMedicoDetalleComponent,
          },
        ],
      },
      {
        path: SEGMENTOS_RUTA.MIS_TURNOS,
        title: 'Mis Turnos',
        canActivate: [roleGuard(['PACIENTE'])],
        children: [
          {
            path: '',
            loadComponent: () => import('./reservas/mis-turnos/mis-turnos'),
          },
          {
            path: ':id',
            title: 'Detalle de Mi Turno',
            component: MiTurnoDetalleComponent,
          },
        ],
      },
      {
        path: SEGMENTOS_RUTA.TURNOS,
        children: [
          {
            path: SEGMENTOS_RUTA.TURNOS_NUEVO,
            title: 'Reservar Turno',
            canActivate: [roleGuard(['PACIENTE', 'ADMINISTRADOR'])],
            loadComponent: () => import('./reservas/reservar-turno/reservar-turno'),
          },
          {
            path: '',
            pathMatch: 'full',
            title: 'Turnos',
            canActivate: [roleGuard(['ADMINISTRADOR'])],
            loadComponent: () => import('./reservas/admin-turnos/admin-turnos'),
          },
          {
            path: ':id',
            title: 'Detalle del Turno',
            canActivate: [roleGuard(['ADMINISTRADOR'])],
            component: TurnoAdminDetalleComponent,
          },
        ],
      },
      {
        path: SEGMENTOS_RUTA.GESTION_MEDICOS,
        title: 'Gestión Médicos y Aranceles',
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        loadComponent: () => import('./medicos/gestion-medicos/gestion-medicos'),
      },
      {
        path: SEGMENTOS_RUTA.ACCESO_DENEGADO,
        title: 'Acceso Denegado',
        loadComponent: () => import('./errors/forbidden-page'),
      },
    ],
  },
  {
    path: SEGMENTOS_RUTA.NOT_FOUND,
    title: 'Página no encontrada',
    loadComponent: () => import('./errors/not-found-page'),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./errors/not-found-page'),
  },
];
