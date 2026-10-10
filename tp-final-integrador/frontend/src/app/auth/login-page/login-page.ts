import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { obtenerRutaInicioPorRol } from '../auth-navigation';
import { AuthService } from '../auth-service';

type CampoLogin = keyof LoginPage['formulario']['controls'];

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, Card, InputText, Password, Button, IconField, InputIcon, Message],
  templateUrl: './login-page.html',
})
export default class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destructor = inject(DestroyRef);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = new FormGroup({
    documento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)],
    }),
    clave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.formulario.controls.documento.valueChanges
      .pipe(takeUntilDestroyed(this.destructor))
      .subscribe((val) => {
        const saneado = val.replace(/\D/g, '');
        if (saneado !== val) {
          this.formulario.controls.documento.setValue(saneado, { emitEvent: false });
        }
      });

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

  esInvalido(campo: CampoLogin): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  obtenerMensajeError(campo: CampoLogin): string | null {
    const control = this.formulario.controls[campo];
    if (!this.esInvalido(campo)) {
      return null;
    }
    if (control.hasError('required')) {
      return campo === 'documento' ? 'Ingresá tu documento.' : 'Ingresá tu contraseña.';
    }
    if (control.hasError('pattern')) {
      return 'El documento debe tener 7 u 8 dígitos.';
    }
    return null;
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
          const rutaDestino = obtenerRutaInicioPorRol(this.auth.rol());
          this.router.navigateByUrl(rutaDestino);
        },
        error: (fallo: unknown) => {
          this.cargando.set(false);
          this.formulario.enable();

          let detalle = 'No pudimos conectar con el servidor. Intentá de nuevo en unos minutos.';
          if (fallo instanceof HttpErrorResponse) {
            if (fallo.status === 401 || fallo.status === 400) {
              detalle = 'Documento o contraseña incorrectos.';
              this.clave.reset('');
            } else if (fallo.status >= 500 || fallo.status === 0) {
              detalle = 'No pudimos conectar con el servidor. Intentá de nuevo en unos minutos.';
            }
          }

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
