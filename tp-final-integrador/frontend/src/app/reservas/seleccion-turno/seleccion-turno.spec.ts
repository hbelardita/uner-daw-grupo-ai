import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MedicoListItem } from '../../medicos/medico';
import { MedicosService } from '../../medicos/medicos-service';
import { SeleccionTurno, type SeleccionTurnoVista } from './seleccion-turno';

const MEDICO: MedicoListItem = {
  id: 3,
  matricula: 5678,
  valorConsulta: 28000,
  nombres: 'Ana',
  apellidos: 'López',
};

const FRANJA = '2026-11-02T13:00:00.000Z';

describe('SeleccionTurno', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionTurno],
      providers: [
        {
          provide: MedicosService,
          useValue: { obtenerMedicos: () => of([MEDICO]), obtenerDisponibilidad: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente(): {
    fixture: ComponentFixture<SeleccionTurno>;
    componente: SeleccionTurno;
    emitidas: (SeleccionTurnoVista | null)[];
  } {
    const fixture = TestBed.createComponent(SeleccionTurno);
    const emitidas: (SeleccionTurnoVista | null)[] = [];
    fixture.componentInstance.seleccion.subscribe((seleccion) => emitidas.push(seleccion));

    return { fixture, componente: fixture.componentInstance, emitidas };
  }

  it('emite la selección completa cuando hay profesional, fecha y franja', () => {
    const { componente, emitidas } = crearComponente();

    componente.seleccionarMedico(MEDICO);
    componente.franjaSeleccionada.set(FRANJA);
    TestBed.tick();

    expect(emitidas.at(-1)).toEqual({
      medico: MEDICO,
      fechaHoraIso: FRANJA,
      etiquetaFecha: componente.fechaSeleccionada()?.etiquetaCompleta,
      rangoHorario: expect.stringContaining(' hs'),
    });
  });

  it('no emite null al deshabilitar la selección', () => {
    const { fixture, componente, emitidas } = crearComponente();

    componente.seleccionarMedico(MEDICO);
    componente.franjaSeleccionada.set(FRANJA);
    TestBed.tick();
    const emisionesConSeleccion = emitidas.length;

    fixture.componentRef.setInput('habilitado', false);
    TestBed.tick();
    fixture.componentRef.setInput('habilitado', true);
    TestBed.tick();

    expect(emitidas.length).toBe(emisionesConSeleccion);
    expect(emitidas.at(-1)).not.toBeNull();
  });

  it('emite null al invalidar la franja elegida', () => {
    const { componente, emitidas } = crearComponente();

    componente.seleccionarMedico(MEDICO);
    componente.franjaSeleccionada.set(FRANJA);
    TestBed.tick();

    componente.recargarDisponibilidad();
    TestBed.tick();

    expect(emitidas.at(-1)).toBeNull();
  });
});
