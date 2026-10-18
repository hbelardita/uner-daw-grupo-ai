import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Usuario } from '../auth/auth-dto';
import { AuthService } from '../auth/auth-service';
import type { RolUsuario } from '../auth/rol-usuario';
import {
  formatearDocumento,
  mostrarBarraInferiorPorRol,
  obtenerEtiquetaRol,
  obtenerInicialesUsuario,
  obtenerItemsNavegacion,
} from './layout-navigation';
import PrivateLayout from './private-layout';

@Component({
  selector: 'app-dummy-view',
  imports: [],
  template: '<p>Contenido de prueba</p>',
})
class DummyViewComponent {}

describe('layout-navigation (funciones puras)', () => {
  describe('obtenerItemsNavegacion', () => {
    it('debe devolver 2 destinos para PACIENTE incluyendo /turnos/nuevo', () => {
      const items = obtenerItemsNavegacion('PACIENTE');
      expect(items).toEqual([
        {
          etiqueta: 'Mis Turnos',
          ruta: '/mis-turnos',
          icono: 'pi pi-calendar',
          exacto: false,
        },
        {
          etiqueta: 'Reservar',
          ruta: '/turnos/nuevo',
          icono: 'pi pi-calendar-plus',
          exacto: true,
        },
      ]);
    });

    it('debe devolver 1 destino para MEDICO correspondiente a su agenda', () => {
      const items = obtenerItemsNavegacion('MEDICO');
      expect(items).toEqual([
        {
          etiqueta: 'Mi Agenda',
          ruta: '/agenda',
          icono: 'pi pi-calendar-clock',
          exacto: false,
        },
      ]);
    });

    it('debe devolver 3 destinos para ADMINISTRADOR incluyendo /turnos/nuevo', () => {
      const items = obtenerItemsNavegacion('ADMINISTRADOR');
      expect(items).toEqual([
        {
          etiqueta: 'Turnos',
          ruta: '/turnos',
          icono: 'pi pi-table',
          exacto: true,
        },
        {
          etiqueta: 'Nueva Reserva',
          ruta: '/turnos/nuevo',
          icono: 'pi pi-calendar-plus',
          exacto: true,
        },
        {
          etiqueta: 'Médicos',
          ruta: '/gestion',
          icono: 'pi pi-id-card',
          exacto: false,
        },
      ]);
    });

    it('debe devolver arreglo vacio para rol nulo o no reconocido', () => {
      expect(obtenerItemsNavegacion(null)).toEqual([]);
      expect(obtenerItemsNavegacion(undefined)).toEqual([]);
      expect(obtenerItemsNavegacion('DESCONOCIDO' as unknown as RolUsuario)).toEqual([]);
    });
  });

  describe('mostrarBarraInferiorPorRol', () => {
    it('debe ser true para PACIENTE y ADMINISTRADOR (> 1 destino)', () => {
      expect(mostrarBarraInferiorPorRol('PACIENTE')).toBe(true);
      expect(mostrarBarraInferiorPorRol('ADMINISTRADOR')).toBe(true);
    });

    it('debe ser false para MEDICO (solo 1 destino para maximizar altura de agenda)', () => {
      expect(mostrarBarraInferiorPorRol('MEDICO')).toBe(false);
    });

    it('debe ser false para roles no autenticados o nulos', () => {
      expect(mostrarBarraInferiorPorRol(null)).toBe(false);
      expect(mostrarBarraInferiorPorRol(undefined)).toBe(false);
    });
  });

  describe('obtenerEtiquetaRol', () => {
    it('debe mapear cada rol a su etiqueta clinica en español', () => {
      expect(obtenerEtiquetaRol('PACIENTE')).toBe('Paciente');
      expect(obtenerEtiquetaRol('MEDICO')).toBe('Médico');
      expect(obtenerEtiquetaRol('ADMINISTRADOR')).toBe('Administrador');
      expect(obtenerEtiquetaRol(null)).toBe('');
    });
  });

  describe('obtenerInicialesUsuario', () => {
    it('debe componer las dos iniciales en mayúsculas a partir de nombres y apellidos', () => {
      expect(obtenerInicialesUsuario('Maria', 'Gomez')).toBe('MG');
      expect(obtenerInicialesUsuario('  juan  ', '  perez  ')).toBe('JP');
    });

    it('debe usar U por defecto cuando ambos campos son nulos o vacios', () => {
      expect(obtenerInicialesUsuario('', '')).toBe('U');
      expect(obtenerInicialesUsuario(null, null)).toBe('U');
      expect(obtenerInicialesUsuario(undefined, undefined)).toBe('U');
    });

    it('debe aceptar nombre o apellido unico', () => {
      expect(obtenerInicialesUsuario('Carlos', '')).toBe('C');
      expect(obtenerInicialesUsuario('', 'Rodriguez')).toBe('R');
    });
  });

  describe('formatearDocumento', () => {
    it('debe formatear con separador de miles para 8 y 7 digitos', () => {
      expect(formatearDocumento('30123456')).toBe('30.123.456');
      expect(formatearDocumento('8765432')).toBe('8.765.432');
    });

    it('debe ignorar caracteres no numericos preexistentes', () => {
      expect(formatearDocumento('30.123.456')).toBe('30.123.456');
      expect(formatearDocumento('DNI 30-123-456')).toBe('30.123.456');
    });

    it('debe retornar cadena vacia ante valores nulos, vacios o sin digitos', () => {
      expect(formatearDocumento('')).toBe('');
      expect(formatearDocumento(null)).toBe('');
      expect(formatearDocumento(undefined)).toBe('');
    });
  });
});

describe('PrivateLayout e integracion de Shell Clinico', () => {
  const rolMock = signal<RolUsuario | null>('PACIENTE');
  const usuarioMock = signal<Usuario | null>(null);
  const nombreCompletoMock = signal<string>('Juan Perez');
  const cerrarSesionMock = vi.fn();

  const authServiceStub = {
    rol: rolMock,
    usuario: usuarioMock,
    nombreCompleto: nombreCompletoMock,
    cerrarSesion: cerrarSesionMock,
  };

  beforeEach(async () => {
    cerrarSesionMock.mockClear();
    rolMock.set('PACIENTE');
    usuarioMock.set({
      id: 1,
      documento: '30123456',
      apellidos: 'Perez',
      nombres: 'Juan',
      email: 'juan.perez@test.com',
      rol: 'PACIENTE',
      estado: 'ACTIVO',
    });
    nombreCompletoMock.set('Juan Perez');

    await TestBed.configureTestingModule({
      imports: [PrivateLayout],
      providers: [
        provideRouter([
          { path: 'mis-turnos', component: DummyViewComponent },
          { path: 'turnos/nuevo', component: DummyViewComponent },
          { path: 'agenda', component: DummyViewComponent },
          { path: 'turnos', component: DummyViewComponent },
          { path: 'gestion', component: DummyViewComponent },
        ]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();
  });

  it('debe renderizar la navegacion de PACIENTE con barra inferior y sin boton de hamburguesa pi-bars', () => {
    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.pi-bars')).toBeNull();

    const navEscritorio = compiled.querySelector('nav[aria-label="Navegación principal"]');
    expect(navEscritorio).not.toBeNull();
    const enlacesEscritorio = navEscritorio?.querySelectorAll('a');
    expect(enlacesEscritorio?.length).toBe(2);
    expect(enlacesEscritorio?.[0].textContent).toContain('Mis Turnos');
    expect(enlacesEscritorio?.[1].textContent).toContain('Reservar');

    const navInferior = compiled.querySelector('nav[aria-label="Navegación inferior"]');
    expect(navInferior).not.toBeNull();
    const enlacesInferior = navInferior?.querySelectorAll('a');
    expect(enlacesInferior?.length).toBe(2);
    expect(enlacesInferior?.[0].textContent).toContain('Mis Turnos');
    expect(enlacesInferior?.[1].textContent).toContain('Reservar');
  });

  it('debe suprimir la barra inferior cuando el usuario es MEDICO', () => {
    rolMock.set('MEDICO');
    usuarioMock.set({
      id: 2,
      documento: '20111222',
      apellidos: 'Gomez',
      nombres: 'Maria',
      email: 'maria.gomez@test.com',
      rol: 'MEDICO',
      estado: 'ACTIVO',
      medico: { id: 1, matricula: 1234, valorConsulta: 10000 },
    });
    nombreCompletoMock.set('Maria Gomez');

    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const navInferior = compiled.querySelector('nav[aria-label="Navegación inferior"]');
    expect(navInferior).toBeNull();

    const navEscritorio = compiled.querySelector('nav[aria-label="Navegación principal"]');
    expect(navEscritorio?.textContent).toContain('Mi Agenda');
  });

  it('debe renderizar las 3 pestañas para ADMINISTRADOR en barra inferior y superior', () => {
    rolMock.set('ADMINISTRADOR');
    usuarioMock.set({
      id: 3,
      documento: '10999888',
      apellidos: 'Admin',
      nombres: 'Super',
      email: 'admin@test.com',
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO',
    });
    nombreCompletoMock.set('Super Admin');

    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const navInferior = compiled.querySelector('nav[aria-label="Navegación inferior"]');
    expect(navInferior).not.toBeNull();
    const enlacesInferior = navInferior?.querySelectorAll('a');
    expect(enlacesInferior?.length).toBe(3);
    expect(enlacesInferior?.[0].textContent).toContain('Turnos');
    expect(enlacesInferior?.[1].textContent).toContain('Nueva Reserva');
    expect(enlacesInferior?.[2].textContent).toContain('Médicos');
  });

  it('debe abrir y cerrar el menú contextual móvil mostrando identidad y permitiendo cerrar sesión', () => {
    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#menu-usuario-movil')).toBeNull();

    const botonAvatar = compiled.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement | null;
    expect(botonAvatar).not.toBeNull();
    expect(botonAvatar?.textContent).toContain('JP');

    botonAvatar?.click();
    fixture.detectChanges();

    const menuMovil = compiled.querySelector('#menu-usuario-movil');
    expect(menuMovil).not.toBeNull();
    expect(menuMovil?.textContent).toContain('Juan Perez');
    expect(menuMovil?.textContent).toContain('Paciente');
    expect(menuMovil?.textContent).toContain('DNI 30.123.456');

    const botonCerrarSesion = menuMovil?.querySelector('button') as HTMLButtonElement | null;
    expect(botonCerrarSesion).not.toBeNull();
    botonCerrarSesion?.click();
    fixture.detectChanges();

    expect(cerrarSesionMock).toHaveBeenCalledTimes(1);
    expect(compiled.querySelector('#menu-usuario-movil')).toBeNull();
  });
});
