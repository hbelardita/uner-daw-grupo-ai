import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import type { PacienteResumen } from './paciente';

@Injectable({
  providedIn: 'root',
})
export class PacientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  buscar(busqueda?: string): Observable<PacienteResumen[]> {
    const termino = busqueda?.trim();
    const params = termino ? new HttpParams().set('busqueda', termino) : new HttpParams();

    return this.http.get<PacienteResumen[]>(`${this.baseUrl}/pacientes`, { params });
  }
}
