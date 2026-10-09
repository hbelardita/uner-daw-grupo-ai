import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import type { LoginResponse } from './auth-dto';

const TOKEN_KEY = '@app-daw/token';

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly token = signal<string | null>(readStoredToken());
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly estaAutenticado = computed(() => this.token() !== null);

  iniciarSesion(documento: string, clave: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { documento, clave }).pipe(
      tap((respuesta) => {
        this.guardarToken(respuesta.token);
      }),
    );
  }

  cerrarSesion(): void {
    this.eliminarToken();
  }

  private guardarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private eliminarToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }
}
