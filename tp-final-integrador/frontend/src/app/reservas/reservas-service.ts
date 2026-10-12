import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import { obtenerFechaLocalIso } from './regla-cancelacion';
import type { ActualizarReservaEstado, Reserva } from './reserva';
import { TurnoMedicoResponse } from './reservas-dto';
import type { TurnoAgenda } from './turno-agenda';
import { mapearTurnosMedicosATurnosAgenda } from './turno-agenda.mapper';

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerTurnosMedico(idMedico: number, fecha: Date | string): Observable<TurnoAgenda[]> {
    const fechaParam = this.normalizarFecha(fecha);
    const params = new HttpParams().set('fecha', fechaParam);

    return this.http
      .get<TurnoMedicoResponse[]>(`${this.baseUrl}/medicos/${idMedico}/turnos`, { params })
      .pipe(map(mapearTurnosMedicosATurnosAgenda));
  }

  obtenerMisReservas(): Observable<Reserva[]> {
    return of([]);
  }

  cancelarReserva(id: number): Observable<Reserva> {
    return throwError(
      () => new Error(`No se pudo cancelar la reserva ${id}: endpoint no implementado en backend`),
    );
  }

  cambiarEstado(
    reservaId: number,
    payload: ActualizarReservaEstado,
  ): Observable<ActualizarReservaEstado> {
    return this.http.patch<ActualizarReservaEstado>(
      `${this.baseUrl}/reservas/${reservaId}/estado`,
      payload,
    );
  }
  private normalizarFecha(fecha?: Date | string | null): string {
    if (!fecha) {
      return obtenerFechaLocalIso(new Date());
    }
    if (fecha instanceof Date) {
      return obtenerFechaLocalIso(fecha);
    }
    return fecha.includes('T') ? obtenerFechaLocalIso(new Date(fecha)) : fecha;
  }
}
