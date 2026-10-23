import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AutoComplete,
  type AutoCompleteCompleteEvent,
  type AutoCompletePassThrough,
} from 'primeng/autocomplete';
import { Button } from 'primeng/button';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { DocumentoPipe } from '../../shared/documento-pipe';
import type { PacienteResumen } from '../paciente';
import { PacientesService } from '../pacientes-service';

export const RETRASO_BUSQUEDA_MS = 300;

const RETRASO_AUTOCOMPLETE_MS = 0;
const LONGITUD_MINIMA_BUSQUEDA = 1;
const ID_ENTRADA = 'busqueda-paciente';
const ID_AYUDA = 'ayuda-buscador-paciente';
const ALTURA_MINIMA_TACTIL = '3rem';
const MENSAJE_ERROR = 'No pudimos buscar pacientes. Revisá la conexión e intentá nuevamente.';

const DESCRIPCION_ENTRADA: AutoCompletePassThrough = {
  pcInputText: {
    root: {
      'aria-describedby': ID_AYUDA,
    },
  },
  option: {
    style: { minHeight: ALTURA_MINIMA_TACTIL },
  },
};

@Component({
  selector: 'app-buscador-paciente',
  imports: [AutoComplete, Button, DocumentoPipe, FormsModule],
  templateUrl: './buscador-paciente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorPaciente {
  private readonly pacientesService = inject(PacientesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly autocompletar = viewChild(AutoComplete);

  private readonly busquedas = new Subject<string>();
  private ultimoTermino = '';

  readonly pacienteSeleccionado = model<PacienteResumen | null>(null);

  protected readonly sugerencias = signal<PacienteResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sinResultados = signal(false);
  protected readonly consulta = signal('');

  protected readonly idEntrada = ID_ENTRADA;
  protected readonly idAyuda = ID_AYUDA;
  protected readonly retrasoAutocomplete = RETRASO_AUTOCOMPLETE_MS;
  protected readonly longitudMinimaBusqueda = LONGITUD_MINIMA_BUSQUEDA;
  protected readonly descripcionEntrada = DESCRIPCION_ENTRADA;

  protected readonly etiquetaPaciente = (paciente: PacienteResumen): string =>
    `${paciente.apellidos}, ${paciente.nombres}`;

  constructor() {
    this.busquedas
      .pipe(
        debounceTime(RETRASO_BUSQUEDA_MS),
        distinctUntilChanged(),
        switchMap((termino) => {
          this.ultimoTermino = termino;
          this.cargando.set(true);
          this.error.set(null);
          this.sinResultados.set(false);

          return this.pacientesService.buscar(termino).pipe(
            catchError(() => {
              this.error.set(MENSAJE_ERROR);
              return of<PacienteResumen[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pacientes) => this.aplicarResultados(pacientes));

    // El backend devuelve los primeros 10 pacientes activos cuando la consulta llega vacía.
    this.busquedas.next('');
  }

  protected buscar(evento: AutoCompleteCompleteEvent): void {
    this.consulta.set(evento.query);
    this.busquedas.next(evento.query);
  }

  protected actualizarConsulta(valor: unknown): void {
    this.consulta.set(typeof valor === 'string' ? valor : '');
  }

  protected seleccionarPaciente(paciente: PacienteResumen): void {
    this.consulta.set('');
    this.pacienteSeleccionado.set(paciente);
  }

  protected manejarLimpiado(): void {
    this.consulta.set('');
    this.busquedas.next('');
  }

  protected vaciarBusqueda(): void {
    const autocompletar = this.autocompletar();
    if (autocompletar) {
      // clear() emite onClear, que limpia la consulta y relanza la búsqueda vacía.
      autocompletar.clear();
    } else {
      this.manejarLimpiado();
    }
    this.enfocarEntrada();
  }

  protected reintentar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.sinResultados.set(false);

    this.pacientesService
      .buscar(this.ultimoTermino)
      .pipe(
        catchError(() => {
          this.error.set(MENSAJE_ERROR);
          return of<PacienteResumen[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pacientes) => this.aplicarResultados(pacientes));
  }

  protected cambiarPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.consulta.set('');
    this.busquedas.next('');
    // El campo vuelve a existir recién en el siguiente render, por eso el foco se difiere.
    afterNextRender(() => this.enfocarEntrada(), { injector: this.injector });
  }

  private aplicarResultados(pacientes: PacienteResumen[]): void {
    this.sugerencias.set(pacientes);
    this.cargando.set(false);
    this.sinResultados.set(pacientes.length === 0 && this.error() === null);
  }

  private enfocarEntrada(): void {
    this.host.nativeElement.querySelector<HTMLInputElement>(`#${ID_ENTRADA}`)?.focus();
  }
}
