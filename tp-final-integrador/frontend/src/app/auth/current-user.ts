import { computed, Injectable, signal } from '@angular/core';
import type { MedicoProfile, Usuario } from './auth-dto';

@Injectable({
  providedIn: 'root',
})
export class CurrentUser {
  private readonly _usuario = signal<Usuario | null>(null);

  readonly usuario = this._usuario.asReadonly();
  readonly medico = computed<MedicoProfile | undefined>(() => this._usuario()?.medico);
  readonly nombreCompleto = computed<string>(() => {
    const u = this._usuario();
    return u ? `${u.nombres} ${u.apellidos}` : '';
  });

  establecerUsuario(usuario: Usuario | null): void {
    this._usuario.set(usuario);
  }

  limpiar(): void {
    this._usuario.set(null);
  }
}
