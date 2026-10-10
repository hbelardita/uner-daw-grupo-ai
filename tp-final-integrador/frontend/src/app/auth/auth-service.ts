import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, switchMap, tap, type Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';
import type { LoginResponse, Usuario } from './auth-dto';
import { CurrentUser } from './current-user';
import { decodeJwtPayload } from './jwt-utils';
import type { RolUsuario } from './rol-usuario';
import { TokenStorage } from './token-storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly currentUser = inject(CurrentUser);

  private readonly token = signal<string | null>(this.tokenStorage.obtenerToken());

  readonly tokenSignal = this.token.asReadonly();
  readonly usuario = this.currentUser.usuario;
  readonly medico = this.currentUser.medico;
  readonly nombreCompleto = this.currentUser.nombreCompleto;
  readonly estaAutenticado = computed(() => this.token() !== null);

  readonly rol = computed<RolUsuario | null>(() => {
    const usuarioActual = this.currentUser.usuario();
    if (usuarioActual?.rol) {
      return usuarioActual.rol;
    }
    const tokenActual = this.token();
    if (tokenActual) {
      return decodeJwtPayload(tokenActual)?.rol ?? null;
    }
    return null;
  });

  iniciarSesion(documento: string, clave: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { documento, clave }).pipe(
      tap((respuesta) => {
        this.tokenStorage.guardarToken(respuesta.token);
        this.token.set(respuesta.token);
      }),
      switchMap((respuesta) =>
        this.obtenerPerfil().pipe(
          map(() => respuesta),
          catchError(() => of(respuesta)),
        ),
      ),
    );
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/auth/me`).pipe(
      tap((perfil) => {
        this.currentUser.establecerUsuario(perfil);
      }),
    );
  }

  cargarUsuarioActual(): Observable<Usuario | null> {
    const tokenActual = this.token() ?? this.tokenStorage.obtenerToken();
    if (!tokenActual) {
      return of(null);
    }
    if (this.token() !== tokenActual) {
      this.token.set(tokenActual);
    }
    return this.obtenerPerfil().pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.cerrarSesion();
        }
        return of(null);
      }),
    );
  }

  cerrarSesion(): void {
    this.tokenStorage.eliminarToken();
    this.token.set(null);
    this.currentUser.limpiar();
  }
}
