import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import type { PacienteAdminResponse } from '../reservas/reservas-dto';
import type { ObtenerPacientesAdmin } from './pacientes-dto';

@Injectable({
  providedIn: 'root',
})
export class Pacientes {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerPacientes(busqueda?: string): Observable<PacienteAdminResponse[]> {
    let params = new HttpParams();

    if (busqueda?.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }

    return this.http.get<PacienteAdminResponse[]>(`${this.baseUrl}/pacientes`, { params });
  }

  obtenerPacientesAdmin(filtros: ObtenerPacientesAdmin = {}): Observable<PacienteAdminResponse[]> {
    return this.obtenerPacientes(filtros.busqueda);
  }
}
