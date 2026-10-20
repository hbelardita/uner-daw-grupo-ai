import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import { obtenerFechaLocalIso } from '../shared/functions/fecha-clinica';
import type { ActualizarReservaEstado, CrearReserva } from './reserva';
import {
  ActualizarReservaEstadoResponse,
  CancelarReservaResponse,
  CrearReservaResponse,
  type FiltrosReservasAdmin,
  HistorialReservaResponse,
  type ReservasAdminPaginadasResponse,
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

  obtenerTodasLasReservas(
    filtros: FiltrosReservasAdmin = {},
  ): Observable<ReservasAdminPaginadasResponse> {
    let params = new HttpParams();

    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }
    if (filtros.idMedico !== undefined) {
      params = params.set('idMedico', filtros.idMedico);
    }
    if (filtros.busquedaPaciente) {
      params = params.set('busquedaPaciente', filtros.busquedaPaciente);
    }
    if (filtros.estado && filtros.estado.length > 0) {
      params = params.set('estado', filtros.estado.join(','));
    }
    if (filtros.pagina !== undefined) {
      params = params.set('pagina', filtros.pagina);
    }
    if (filtros.limite !== undefined) {
      params = params.set('limite', filtros.limite);
    }
    if (filtros.ordenarPor) {
      params = params.set('ordenarPor', filtros.ordenarPor);
    }
    if (filtros.direccion) {
      params = params.set('direccion', filtros.direccion);
    }

    return this.http.get<ReservasAdminPaginadasResponse>(`${this.baseUrl}/reservas`, { params });
  }

  crearReserva(payload: CrearReserva): Observable<CrearReservaResponse> {
    return this.http.post<CrearReservaResponse>(`${this.baseUrl}/reservas`, payload);
  }

  cancelarReserva(id: number): Observable<CancelarReservaResponse> {
    return this.http.post<CancelarReservaResponse>(
      `${this.baseUrl}/reservas/${id}/cancelacion`,
      null,
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
