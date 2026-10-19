import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import type { ActualizarValorConsultaRequest, DisponibilidadSlot, MedicoListItem } from './medico';

@Injectable({
  providedIn: 'root',
})
export class MedicosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerMedicos(): Observable<MedicoListItem[]> {
    return this.http.get<MedicoListItem[]>(`${this.baseUrl}/medicos`);
  }

  actualizarValorConsulta(
    id: number,
    payload: ActualizarValorConsultaRequest,
  ): Observable<MedicoListItem> {
    return this.http.patch<MedicoListItem>(`${this.baseUrl}/medicos/${id}/valor-consulta`, payload);
  }

  obtenerDisponibilidad(id: number, fecha: string): Observable<DisponibilidadSlot[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<DisponibilidadSlot[]>(`${this.baseUrl}/medicos/${id}/disponibilidad`, {
      params,
    });
  }
}
