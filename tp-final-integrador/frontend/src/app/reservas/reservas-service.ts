import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { obtenerFechaLocalIso } from './regla-cancelacion';
import type { FiltroReservas, Reserva } from './reserva';

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
      fechaHora: '2026-10-11T11:00:00.000Z',
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
      fechaHora: '2026-10-12T10:00:00.000Z',
      estado: 'ACTIVO',
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
    {
      id: 6,
      idMedico: 1,
      idPaciente: 4,
      fechaHora: '2026-10-11T08:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 12000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 4,
        nombres: 'María',
        apellidos: 'Rodríguez',
        documento: '30123456',
      },
    },
    {
      id: 7,
      idMedico: 1,
      idPaciente: 5,
      fechaHora: '2026-10-11T10:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 12000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 5,
        nombres: 'Jorge',
        apellidos: 'Díaz',
        documento: '25111222',
      },
    },
    {
      id: 8,
      idMedico: 1,
      idPaciente: 6,
      fechaHora: '2026-10-11T14:00:00.000Z',
      estado: 'ATENDIDO',
      valorConsulta: 12000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 6,
        nombres: 'Lucía',
        apellidos: 'Fernández',
        documento: '33444555',
      },
    },
    {
      id: 9,
      idMedico: 1,
      idPaciente: 7,
      fechaHora: '2026-10-15T11:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 12000,
      medico: {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Gómez',
        matricula: 45892,
      },
      paciente: {
        id: 7,
        nombres: 'Pedro',
        apellidos: 'Sosa',
        documento: '27888999',
      },
    },
    {
      id: 10,
      idMedico: 2,
      idPaciente: 8,
      fechaHora: '2026-10-11T09:00:00.000Z',
      estado: 'ACTIVO',
      valorConsulta: 15000,
      medico: {
        id: 2,
        nombres: 'Mariana',
        apellidos: 'López',
        matricula: 52140,
      },
      paciente: {
        id: 8,
        nombres: 'Ana',
        apellidos: 'Vera',
        documento: '31222333',
      },
    },
  ];

  obtenerMisReservas(): Observable<Reserva[]> {
    return of(this.reservasMock.filter((r) => r.idPaciente === 3)).pipe(delay(500));
  }

  obtenerReservas(filtro?: FiltroReservas): Observable<Reserva[]> {
    let fechaFiltro: string | null = null;
    let idMedico: number | undefined;
    let idPaciente: number | undefined;
    let estado: string | undefined;

    if (filtro && typeof filtro === 'object') {
      if (filtro.fecha instanceof Date) {
        fechaFiltro = obtenerFechaLocalIso(filtro.fecha);
      } else if (typeof filtro.fecha === 'string') {
        fechaFiltro = filtro.fecha.includes('T')
          ? obtenerFechaLocalIso(new Date(filtro.fecha))
          : filtro.fecha;
      }
      idMedico = filtro.idMedico;
      idPaciente = filtro.idPaciente;
      estado = filtro.estado;
    }

    let resultado = [...this.reservasMock];

    if (idMedico !== undefined) {
      resultado = resultado.filter((r) => r.idMedico === idMedico);
    }

    if (idPaciente !== undefined) {
      resultado = resultado.filter((r) => r.idPaciente === idPaciente);
    }

    if (estado !== undefined) {
      resultado = resultado.filter((r) => r.estado === estado);
    }

    if (fechaFiltro) {
      resultado = resultado.filter((r) => {
        const fechaReservaIso = obtenerFechaLocalIso(new Date(r.fechaHora));
        return fechaReservaIso === fechaFiltro;
      });
    }

    resultado.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    return of(resultado).pipe(delay(500));
  }

  cancelarReserva(id: number): Observable<Reserva> {
    const indice = this.reservasMock.findIndex((r) => r.id === id);
    if (indice === -1) {
      return throwError(() => new Error('Reserva no encontrada'));
    }
    const reservaActualizada: Reserva = {
      ...this.reservasMock[indice],
      estado: 'CANCELADO',
    };
    this.reservasMock[indice] = reservaActualizada;
    return of(reservaActualizada).pipe(delay(300));
  }
}
