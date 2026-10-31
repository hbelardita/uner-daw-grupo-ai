import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MedicoListItem } from '../../medicos/medico';
import { MedicosService } from '../../medicos/medicos-service';
import type { PacienteResumen } from '../../pacientes/paciente';
import type { CrearReservaResponse } from '../reservas-dto';
import { ReservasService } from '../reservas-service';
import type { SeleccionTurnoVista } from '../seleccion-turno/seleccion-turno';
import ReservarTurnoAdmin from './reservar-turno-admin';

const PACIENTE: PacienteResumen = {
  id: 7,
  documento: '30123456',
  nombres: 'María',
  apellidos: 'Gómez',
};

const MEDICO: MedicoListItem = {
  id: 3,
  matricula: 5678,
  valorConsulta: 28000,
  nombres: 'Ana',
  apellidos: 'López',
};

const SELECCION: SeleccionTurnoVista = {
  medico: MEDICO,
  fechaHoraIso: '2026-11-02T13:00:00.000Z',
  etiquetaFecha: 'Lunes 2 de noviembre',
  rangoHorario: '10:00 a 11:00 hs',
};

const RESERVA: CrearReservaResponse = {
  id: 41,
  idMedico: MEDICO.id,
  idPaciente: PACIENTE.id,
  fechaHora: SELECCION.fechaHoraIso,
  estado: 'ACTIVO',
  valorConsulta: MEDICO.valorConsulta,
};

describe('ReservarTurnoAdmin', () => {
  let crearReserva: ReturnType<typeof vi.fn<(payload: unknown) => unknown>>;

  beforeEach(async () => {
    crearReserva = vi.fn(() => of(RESERVA));

    await TestBed.configureTestingModule({
      imports: [ReservarTurnoAdmin],
      providers: [
        { provide: ReservasService, useValue: { crearReserva } },
        { provide: MedicosService, useValue: { obtenerMedicos: () => of([MEDICO]) } },
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

  function crearComponente(): ReservarTurnoAdmin {
    return TestBed.createComponent(ReservarTurnoAdmin).componentInstance;
  }

  it('no habilita la selección ni la confirmación hasta elegir un paciente', () => {
    const componente = crearComponente();
    componente.seleccionActiva.set(SELECCION);

    expect(componente.habilitarSeleccion()).toBe(false);
    expect(componente.puedeConfirmar()).toBe(false);
    expect(componente.motivoBloqueo()).toBe('Seleccioná un paciente para confirmar la reserva.');
  });

  it('explica que falta la selección de turno cuando ya hay paciente', () => {
    const componente = crearComponente();
    componente.pacienteSeleccionado.set(PACIENTE);

    expect(componente.habilitarSeleccion()).toBe(true);
    expect(componente.puedeConfirmar()).toBe(false);
    expect(componente.motivoBloqueo()).toBe('Elegí profesional, fecha y horario para confirmar.');
  });

  it('envía el paciente seleccionado como destinatario de la reserva', () => {
    const componente = crearComponente();
    componente.pacienteSeleccionado.set(PACIENTE);
    componente.seleccionActiva.set(SELECCION);

    componente.confirmarReserva();

    expect(crearReserva).toHaveBeenCalledWith({
      idMedico: MEDICO.id,
      fechaHora: SELECCION.fechaHoraIso,
      idPaciente: PACIENTE.id,
    });
  });
});
