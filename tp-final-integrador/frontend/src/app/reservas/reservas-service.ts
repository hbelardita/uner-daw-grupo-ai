import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import { obtenerFechaLocalIso } from './regla-cancelacion';
import type { ActualizarReservaEstado } from './reserva';
import {
  ActualizarReservaEstadoResponse,
  CancelarReservaResponse,
  HistorialReservaResponse,
  TurnoMedicoResponse,
} from './reservas-dto';
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

  obtenerMisReservas(): Observable<HistorialReservaResponse[]> {
    return this.http.get<HistorialReservaResponse[]>(`${this.baseUrl}/reservas`);
  }

  cancelarReserva(id: number): Observable<CancelarReservaResponse> {
    return this.http.post<CancelarReservaResponse>(
      `${this.baseUrl}/reservas/${id}/cancelacion`,
      {},
    );
  }

  cambiarEstado(
    reservaId: number,
    payload: ActualizarReservaEstado,
  ): Observable<ActualizarReservaEstadoResponse> {
    return this.http.patch<ActualizarReservaEstadoResponse>(
      `${this.baseUrl}/reservas/${reservaId}`,
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
