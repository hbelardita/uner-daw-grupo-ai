import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';
import { TokenStorage } from './token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorage);
  const token = tokenStorage.obtenerToken();
  const tieneToken = token !== null && token.trim().length > 0;

  const peticion = tieneToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      const sesionActiva = tieneToken || authService.estaAutenticado();
      if (error instanceof HttpErrorResponse && error.status === 401 && sesionActiva) {
        authService.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
