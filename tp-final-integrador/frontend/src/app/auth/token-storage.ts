import { Injectable } from '@angular/core';

export const TOKEN_KEY = '@app-daw/token';

@Injectable({
  providedIn: 'root',
})
export class TokenStorage {
  obtenerToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  guardarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  eliminarToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
