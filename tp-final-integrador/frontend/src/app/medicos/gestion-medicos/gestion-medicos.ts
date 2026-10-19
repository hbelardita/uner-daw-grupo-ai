import { CurrencyPipe, I18nPluralPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { EmptyState } from '../../shared';
import type { MedicoListItem } from '../medico';
import { MedicosService } from '../medicos-service';

@Component({
  selector: 'app-gestion-medicos',
  imports: [CurrencyPipe, I18nPluralPipe, Button, Skeleton, TableModule, EmptyState],
  templateUrl: './gestion-medicos.html',
})
export class GestionMedicos implements OnInit {
  private readonly medicosService = inject(MedicosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly medicos = signal<MedicoListItem[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly medicoSeleccionado = signal<MedicoListItem | null>(null);
  readonly totalMedicos = computed<number>(() => this.medicos().length);

  readonly mapaPluralMedicos: Record<string, string> = {
    '=1': 'médico clínico registrado',
    other: 'médicos clínicos registrados',
  };

  ngOnInit(): void {
    this.cargarMedicos();
  }

  cargarMedicos(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.medicosService
      .obtenerMedicos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.medicos.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar el listado de médicos clínicos.');
          this.cargando.set(false);
        },
      });
  }

  seleccionarMedicoParaEdicion(medico: MedicoListItem): void {
    this.medicoSeleccionado.set(medico);
  }

  ariaLabelModificar(medico: MedicoListItem): string {
    return 'Modificar arancel de ' + medico.apellidos + ', ' + medico.nombres;
  }
}

export default GestionMedicos;
