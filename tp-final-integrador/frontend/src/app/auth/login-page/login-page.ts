import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { AuthService } from '../auth-service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, Card, InputText, Password, Button, FloatLabel, Message],
  templateUrl: './login-page.html',
})
export default class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly destructor = inject(DestroyRef);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = new FormGroup({
    documento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)],
    }),
    clave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.formulario.valueChanges.pipe(takeUntilDestroyed(this.destructor)).subscribe(() => {
      if (this.error()) {
        this.error.set(null);
      }
    });
  }

  get documento(): FormControl<string> {
    return this.formulario.controls.documento;
  }

  get clave(): FormControl<string> {
    return this.formulario.controls.clave;
  }

  esInvalido(controlName: string) {
    const control = this.formulario.get(controlName);

    return control?.invalid && (control.touched || control.dirty);
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revise los campos marcados.');
      return;
    }
    const { documento, clave } = this.formulario.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.auth
      .iniciarSesion(documento, clave)
      .pipe(takeUntilDestroyed(this.destructor))
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.error.set(null);
          this.messageService.add({
            severity: 'success',
            summary: 'Bienvenido',
            detail: 'Inicio de sesión exitoso',
          });
          // TODO: navegar al destino post-login cuando exista la ruta (p. ej. '/').
        },
        error: (fallo: unknown) => {
          this.cargando.set(false);
          this.formulario.enable();
          const detalle =
            fallo instanceof HttpErrorResponse && fallo.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'Verifique su documento y contraseña.';
          this.error.set(detalle);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo iniciar sesión',
            detail: detalle,
          });
        },
      });
  }
}
