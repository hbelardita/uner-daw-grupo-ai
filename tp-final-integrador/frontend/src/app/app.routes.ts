import { Component, inject } from '@angular/core';
import { type RedirectFunction, type Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth';
import { obtenerRutaInicioPorRol } from './auth/auth-navigation';
import { AuthService } from './auth/auth-service';

@Component({
  selector: 'app-agenda-diaria',
  imports: [],
  template: '<p>Agenda del Médico</p>',
})
export class AgendaDiariaComponent {}

@Component({
  selector: 'app-turno-medico-detalle',
  imports: [],
  template: '<p>Detalle de Turno Médico</p>',
})
export class TurnoMedicoDetalleComponent {}

@Component({
  selector: 'app-mis-turnos-lista',
  imports: [],
  template: '<p>Mis Turnos (Paciente)</p>',
})
export class MisTurnosListaComponent {}

@Component({
  selector: 'app-mi-turno-detalle',
  imports: [],
  template: '<p>Detalle Mi Turno</p>',
})
export class MiTurnoDetalleComponent {}

@Component({
  selector: 'app-turno-nuevo',
  imports: [],
  template: '<p>Reservar Nuevo Turno</p>',
})
export class TurnoNuevoComponent {}

@Component({
  selector: 'app-turnos-admin-lista',
  imports: [],
  template: '<p>Listado Global de Turnos (Admin)</p>',
})
export class TurnosAdminListaComponent {}

@Component({
  selector: 'app-turno-admin-detalle',
  imports: [],
  template: '<p>Detalle de Turno (Admin)</p>',
})
export class TurnoAdminDetalleComponent {}

@Component({
  selector: 'app-gestion-medicos',
  imports: [],
  template: '<p>Gestión de Médicos y Aranceles</p>',
})
export class GestionMedicosComponent {}

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
    path: 'login',
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
        path: 'agenda',
        title: 'Mi Agenda',
        canActivate: [roleGuard(['MEDICO'])],
        children: [
          {
            path: '',
            component: AgendaDiariaComponent,
          },
          {
            path: 'turnos/:id',
            title: 'Detalle del Turno',
            component: TurnoMedicoDetalleComponent,
          },
        ],
      },
      {
        path: 'mis-turnos',
        title: 'Mis Turnos',
        canActivate: [roleGuard(['PACIENTE'])],
        children: [
          {
            path: '',
            component: MisTurnosListaComponent,
          },
          {
            path: ':id',
            title: 'Detalle de Mi Turno',
            component: MiTurnoDetalleComponent,
          },
        ],
      },
      {
        path: 'turnos',
        children: [
          {
            path: 'nueva',
            title: 'Reservar Turno',
            canActivate: [roleGuard(['PACIENTE', 'ADMINISTRADOR'])],
            component: TurnoNuevoComponent,
          },
          {
            path: '',
            pathMatch: 'full',
            title: 'Turnos',
            canActivate: [roleGuard(['ADMINISTRADOR'])],
            component: TurnosAdminListaComponent,
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
        path: 'gestion',
        title: 'Gestión Médicos y Aranceles',
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        component: GestionMedicosComponent,
      },
      {
        path: 'acceso-denegado',
        title: 'Acceso Denegado',
        loadComponent: () => import('./errors/forbidden-page'),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./errors/not-found-page'),
  },
];
