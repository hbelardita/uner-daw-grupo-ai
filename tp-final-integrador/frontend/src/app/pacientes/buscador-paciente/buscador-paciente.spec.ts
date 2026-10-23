import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoComplete } from 'primeng/autocomplete';
import { providePrimeNG } from 'primeng/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../app.config';
import type { PacienteResumen } from '../paciente';
import { PacientesService } from '../pacientes-service';
import { BuscadorPaciente, RETRASO_BUSQUEDA_MS } from './buscador-paciente';

const BASE_URL = '/api/v1';

const PACIENTES: PacienteResumen[] = [
  { id: 1, documento: '28456789', nombres: 'Bruno', apellidos: 'Álvarez' },
  { id: 2, documento: '30123456', nombres: 'Ana', apellidos: 'García' },
  { id: 3, documento: '35678912', nombres: 'Carla', apellidos: 'Gómez' },
];

function avanzar(ms: number): void {
  vi.advanceTimersByTime(ms);
}

function obtenerEntrada(raiz: HTMLElement): HTMLInputElement {
  const entrada = raiz.querySelector<HTMLInputElement>('#busqueda-paciente');
  if (!entrada) {
    throw new Error('No se encontró el campo de búsqueda de pacientes.');
  }
  return entrada;
}

function escribir(raiz: HTMLElement, valor: string): void {
  const entrada = obtenerEntrada(raiz);
  entrada.value = valor;
  entrada.dispatchEvent(new Event('input'));
}

describe('PacientesService', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('no envía el parámetro busqueda cuando el término está vacío o en blanco', () => {
    const servicio = TestBed.inject(PacientesService);

    servicio.buscar('   ').subscribe();
    const enBlanco = httpMock.expectOne(`${BASE_URL}/pacientes`);
    expect(enBlanco.request.method).toBe('GET');
    expect(enBlanco.request.params.has('busqueda')).toBe(false);
    enBlanco.flush([]);

    servicio.buscar().subscribe();
    const sinTermino = httpMock.expectOne(`${BASE_URL}/pacientes`);
    expect(sinTermino.request.params.has('busqueda')).toBe(false);
    sinTermino.flush([]);
  });

  it('envía el término recortado en el parámetro busqueda', () => {
    const servicio = TestBed.inject(PacientesService);

    servicio.buscar('  garcía  ').subscribe();
    const peticion = httpMock.expectOne((solicitud) => solicitud.url === `${BASE_URL}/pacientes`);

    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('busqueda')).toBe('garcía');
    peticion.flush([]);
  });
});

describe('BuscadorPaciente', () => {
  let httpMock: HttpTestingController;

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
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePrimeNG(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  function crearBuscador(): { fixture: ComponentFixture<BuscadorPaciente>; raiz: HTMLElement } {
    const fixture = TestBed.createComponent(BuscadorPaciente);
    fixture.detectChanges();

    avanzar(RETRASO_BUSQUEDA_MS);
    const cargaInicial = httpMock.expectOne(
      (peticion) => peticion.url === `${BASE_URL}/pacientes` && !peticion.params.has('busqueda'),
    );
    cargaInicial.flush(PACIENTES);
    fixture.detectChanges();

    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('emite una sola búsqueda después del debounce ante una ráfaga de teclas', () => {
    const { raiz } = crearBuscador();

    escribir(raiz, 'g');
    escribir(raiz, 'ga');
    escribir(raiz, 'gar');

    avanzar(RETRASO_BUSQUEDA_MS - 1);
    expect(httpMock.match((peticion) => peticion.params.has('busqueda'))).toHaveLength(0);

    avanzar(1);
    const peticiones = httpMock.match((peticion) => peticion.params.has('busqueda'));
    expect(peticiones).toHaveLength(1);
    expect(peticiones[0].request.params.get('busqueda')).toBe('gar');
    peticiones[0].flush(PACIENTES);
  });

  it('cancela la búsqueda anterior cuando llega un término nuevo', () => {
    const { raiz } = crearBuscador();

    escribir(raiz, 'gar');
    avanzar(RETRASO_BUSQUEDA_MS);
    const primeraBusqueda = httpMock.expectOne(
      (peticion) => peticion.params.get('busqueda') === 'gar',
    );

    escribir(raiz, 'garcia');
    avanzar(RETRASO_BUSQUEDA_MS);
    const segundaBusqueda = httpMock.expectOne(
      (peticion) => peticion.params.get('busqueda') === 'garcia',
    );

    expect(httpMock.match((peticion) => peticion.params.get('busqueda') === 'gar')).toHaveLength(0);
    segundaBusqueda.flush([PACIENTES[1]]);

    expect(primeraBusqueda.cancelled).toBe(true);
  });

  it('expone la etiqueta, la ayuda y el botón de limpiar para lectores de pantalla', () => {
    const { fixture, raiz } = crearBuscador();
    const entrada = obtenerEntrada(raiz);

    expect(entrada.getAttribute('aria-describedby')).toBe('ayuda-buscador-paciente');
    const etiqueta = raiz.querySelector(`label[for="${entrada.id}"]`);
    expect(etiqueta?.textContent).toContain('Buscar paciente');

    escribir(raiz, 'gar');
    fixture.detectChanges();
    const botonLimpiar = raiz.querySelector('button[aria-label="Limpiar búsqueda de pacientes"]');
    expect(botonLimpiar).not.toBeNull();
  });

  it('emite el paciente elegido a través del modelo y permite cambiarlo', () => {
    const { fixture, raiz } = crearBuscador();
    const paciente = PACIENTES[1];

    const autocompletar = fixture.debugElement.query(By.directive(AutoComplete))
      .componentInstance as AutoComplete;
    autocompletar.onSelect.emit({ originalEvent: new Event('click'), value: paciente });
    fixture.detectChanges();

    expect(fixture.componentInstance.pacienteSeleccionado()).toEqual(paciente);
    expect(raiz.textContent).toContain('García, Ana');
    expect(raiz.textContent).toContain('30.123.456');

    const botonCambiar = Array.from(raiz.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Cambiar paciente'),
    );
    if (!botonCambiar) {
      throw new Error('No se encontró el botón para cambiar de paciente.');
    }
    botonCambiar.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pacienteSeleccionado()).toBeNull();
    expect(obtenerEntrada(raiz).value).toBe('');
  });
});
