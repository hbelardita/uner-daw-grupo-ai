import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import type { PacienteResumen } from '../paciente';
import { PacientesService } from '../pacientes-service';

@Component({
  selector: 'app-pacientes',
  imports: [Button, InputText, ReactiveFormsModule, TableModule],
  templateUrl: './pacientes.html',
})
export class Pacientes {
  private readonly pacientesService = inject(PacientesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pacienteSeleccionado = output<PacienteResumen>();
  protected readonly pacientes = signal<PacienteResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busquedaControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.busquedaControl.valueChanges
      .pipe(
        startWith(this.busquedaControl.value),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((busqueda) => {
          this.cargando.set(true);
          this.error.set(null);

          return this.pacientesService.buscar(busqueda).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar el listado de pacientes.');
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pacientes) => {
        this.pacientes.set(pacientes);
        this.cargando.set(false);
      });
  }

  protected cargarPacientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pacientesService
      .buscar(this.busquedaControl.value)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar el listado de pacientes.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pacientes) => {
        this.pacientes.set(pacientes);
        this.cargando.set(false);
      });
  }

  protected seleccionarPaciente(paciente: PacienteResumen): void {
    this.pacienteSeleccionado.emit(paciente);
  }
}
