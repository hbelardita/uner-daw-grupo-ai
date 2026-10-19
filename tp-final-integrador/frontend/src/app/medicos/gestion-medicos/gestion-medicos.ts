import { CurrencyPipe, I18nPluralPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { EmptyState } from '../../shared';
import { clasificarFalloHttp, type TextosFalloHttp } from '../../shared/functions/fallo-http';
import type { MedicoListItem } from '../medico';
import { MedicosService } from '../medicos-service';
import { ModificarArancelDialog } from '../modificar-arancel-dialog/modificar-arancel-dialog';

const TEXTOS_FALLO_ARANCEL: TextosFalloHttp = {
  desincronizado:
    'El profesional solicitado ya no se encuentra disponible. Actualizamos el listado.',
  sinPermiso: 'No tenés permiso para modificar el valor de consulta.',
  generico: 'No pudimos actualizar el valor de consulta. Por favor, reintentá.',
};

@Component({
  selector: 'app-gestion-medicos',
  imports: [
    CurrencyPipe,
    I18nPluralPipe,
    Button,
    Skeleton,
    TableModule,
    EmptyState,
    ModificarArancelDialog,
  ],
  templateUrl: './gestion-medicos.html',
})
export class GestionMedicos implements OnInit {
  private readonly medicosService = inject(MedicosService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly medicos = signal<MedicoListItem[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly medicoSeleccionado = signal<MedicoListItem | null>(null);
  readonly modalArancelVisible = signal<boolean>(false);
  readonly guardandoArancel = signal<boolean>(false);
  readonly errorArancel = signal<string | null>(null);
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
    this.errorArancel.set(null);
    this.modalArancelVisible.set(true);
  }

  cerrarModalArancel(): void {
    if (this.guardandoArancel()) {
      return;
    }
    this.modalArancelVisible.set(false);
    this.medicoSeleccionado.set(null);
    this.errorArancel.set(null);
  }

  confirmarModificacionArancel(nuevoValor: number): void {
    const medico = this.medicoSeleccionado();
    if (!medico || this.guardandoArancel()) {
      return;
    }

    this.guardandoArancel.set(true);
    this.errorArancel.set(null);

    this.medicosService
      .actualizarValorConsulta(medico.id, { valorConsulta: nuevoValor })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.medicos.update((actuales) =>
            actuales.map((m) => (m.id === actualizado.id ? actualizado : m)),
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Arancel actualizado',
            detail: 'El valor de consulta fue actualizado correctamente.',
          });
          this.guardandoArancel.set(false);
          this.modalArancelVisible.set(false);
          this.medicoSeleccionado.set(null);
        },
        error: (err: unknown) => {
          this.guardandoArancel.set(false);
          const fallo = clasificarFalloHttp(err, TEXTOS_FALLO_ARANCEL);
          if (fallo.requiereRecargar) {
            this.messageService.add({
              severity: 'error',
              summary: 'Profesional no disponible',
              detail: fallo.mensaje,
            });
            this.cerrarModalArancel();
            this.cargarMedicos();
          } else {
            this.errorArancel.set(fallo.mensaje);
          }
        },
      });
  }

  ariaLabelModificar(medico: MedicoListItem): string {
    return 'Modificar arancel de ' + medico.apellidos + ', ' + medico.nombres;
  }
}

export default GestionMedicos;
