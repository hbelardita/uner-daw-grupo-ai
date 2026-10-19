import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsAr from '@angular/common/locales/es-AR';
import { LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../app.config';
import type { HistorialReservaResponse } from '../reservas-dto';
import MisTurnos from './mis-turnos';

registerLocaleData(localeEsAr, 'es-AR');

const BASE_URL = '/api/v1';
const MENSAJE_CONFLICTO =
  'Solo se puede cancelar un turno en estado ACTIVO. El turno se encuentra en estado CANCELADO.';
const MENSAJE_REINTENTO = 'No pudimos cancelar el turno. Por favor, reintentá.';

interface MisTurnosTestApi {
  reservas: () => HistorialReservaResponse[];
  modalCancelacionVisible: () => boolean;
}

function crearReserva(estado: HistorialReservaResponse['estado']): HistorialReservaResponse {
  return {
    id: 7,
    fechaHora: '2027-03-10T09:00:00.000-03:00',
    estado,
    valorConsulta: 15000,
    medico: { id: 3, nombres: 'Ana', apellidos: 'Gomez', matricula: 4321 },
  };
}

function obtenerBoton(raiz: HTMLElement, texto: string): HTMLButtonElement | undefined {
  const botones = Array.from(raiz.querySelectorAll<HTMLButtonElement>('button'));
  return botones.find((boton) => boton.textContent?.includes(texto));
}

describe('MisTurnos: cancelación contra un backend desincronizado', () => {
  let httpMock: HttpTestingController;
  let messageService: MessageService;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    await TestBed.configureTestingModule({
      imports: [MisTurnos],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        providePrimeNG(),
        MessageService,
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: LOCALE_ID, useValue: 'es-AR' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    vi.spyOn(messageService, 'add');
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function prepararComponente(): {
    fixture: ComponentFixture<MisTurnos>;
    componente: MisTurnosTestApi;
    raiz: HTMLElement;
  } {
    const fixture = TestBed.createComponent(MisTurnos);
    fixture.detectChanges();

    const peticionInicial = httpMock.expectOne(`${BASE_URL}/reservas`);
    expect(peticionInicial.request.method).toBe('GET');
    peticionInicial.flush([crearReserva('ACTIVO')]);
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    const botonCancelar = obtenerBoton(raiz, 'Cancelar turno');
    expect(botonCancelar).not.toBeUndefined();
    botonCancelar?.click();
    fixture.detectChanges();

    const botonConfirmar = obtenerBoton(raiz, 'Sí, cancelar turno');
    expect(botonConfirmar).not.toBeUndefined();
    botonConfirmar?.click();
    fixture.detectChanges();

    return {
      fixture,
      componente: fixture.componentInstance as unknown as MisTurnosTestApi,
      raiz,
    };
  }

  it('sincroniza la lista y cierra el diálogo cuando el turno ya está CANCELADO en el servidor', () => {
    const { fixture, componente, raiz } = prepararComponente();

    const peticionCancelacion = httpMock.expectOne(`${BASE_URL}/reservas/7/cancelacion`);
    expect(peticionCancelacion.request.method).toBe('POST');
    peticionCancelacion.flush(
      { message: MENSAJE_CONFLICTO, error: 'Conflict', statusCode: 409 },
      { status: 409, statusText: 'Conflict' },
    );

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Turno no disponible',
      detail: MENSAJE_CONFLICTO,
    });

    const recarga = httpMock.expectOne(`${BASE_URL}/reservas`);
    expect(recarga.request.method).toBe('GET');
    recarga.flush([crearReserva('CANCELADO')]);
    fixture.detectChanges();

    expect(componente.reservas()[0].estado).toBe('CANCELADO');
    expect(componente.modalCancelacionVisible()).toBe(false);
    expect(obtenerBoton(raiz, 'Cancelar turno')).toBeUndefined();
  });

  it('mantiene el diálogo abierto y no recarga cuando el fallo es reintentable', () => {
    const { componente, raiz } = prepararComponente();

    const peticionCancelacion = httpMock.expectOne(`${BASE_URL}/reservas/7/cancelacion`);
    peticionCancelacion.flush(
      { message: 'Boom', error: 'Internal Server Error', statusCode: 500 },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error al cancelar',
      detail: MENSAJE_REINTENTO,
    });

    httpMock.expectNone(`${BASE_URL}/reservas`);

    expect(componente.modalCancelacionVisible()).toBe(true);
    expect(obtenerBoton(raiz, 'Sí, cancelar turno')).not.toBeUndefined();
  });
});
