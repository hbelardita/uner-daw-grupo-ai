import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import type { Reserva } from './reserva';

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private readonly reservasMock: Reserva[] = [
    {
      id: 1,
      idMedico: 1,
      idPaciente: 3,
      fechaHora: '2026-10-15T09:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 12000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '35123456',
      },
    },
    {
      id: 2,
      idMedico: 2,
      idPaciente: 3,
      fechaHora: '2026-10-18T11:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 15000,
      medico: {
        id: 2,
        nombres: 'Mariana',
        apellidos: 'López',
        matricula: 52140,
      },
      paciente: {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '35123456',
      },
    },
    {
      id: 3,
      idMedico: 1,
      idPaciente: 3,
      fechaHora: '2026-10-01T14:00:00.000Z',
      estado: 'ATENDIDO',
      valorConsulta: 10000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '35123456',
      },
    },
    {
      id: 4,
      idMedico: 3,
      idPaciente: 3,
      fechaHora: '2026-09-20T10:00:00.000Z',
      estado: 'CANCELADO',
      valorConsulta: 9500,
      medico: {
        id: 3,
        nombres: 'Esteban',
        apellidos: 'Martínez',
        matricula: 39821,
      },
      paciente: {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '35123456',
      },
    },
    {
      id: 5,
      idMedico: 2,
      idPaciente: 3,
      fechaHora: '2026-09-10T08:00:00.000Z',
      estado: 'AUSENTE',
      valorConsulta: 9500,
      medico: {
        id: 2,
        nombres: 'Mariana',
        apellidos: 'López',
        matricula: 52140,
      },
      paciente: {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '35123456',
      },
    },
  ];

  obtenerMisReservas(): Observable<Reserva[]> {
    return of([...this.reservasMock]).pipe(delay(500));
  }
}
