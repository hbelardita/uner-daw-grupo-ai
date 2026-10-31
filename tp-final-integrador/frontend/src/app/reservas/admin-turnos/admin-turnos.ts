import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { Drawer } from 'primeng/drawer';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { RUTAS } from '../../constantes/rutas';
import type { MedicoListItem } from '../../medicos/medico';
import { MedicosService } from '../../medicos/medicos-service';
import { CancelarTurnoDialog, EmptyState, EstadoBadge } from '../../shared';
import { DocumentoPipe } from '../../shared/documento-pipe';
import { clasificarFalloHttp, type TextosFalloHttp } from '../../shared/functions/fallo-http';
import {
  formatearFechaCorta,
  formatearFechaHoraClinica,
  obtenerFechaLocalIso,
} from '../../shared/functions/fecha-clinica';
import {
  evaluarCancelacionAdministrativa,
  MOTIVO_CANCELACION_INICIADA,
} from '../regla-cancelacion';
import type { EstadoReserva } from '../reserva';
import type {
  CampoOrdenReservasAdmin,
  DireccionOrden,
  FiltrosReservasAdmin,
  ReservaAdminResponse,
} from '../reservas-dto';
import { ReservasService } from '../reservas-service';

export const ESTADOS_RESERVA = ['ACTIVO', 'ATENDIDO', 'AUSENTE', 'CANCELADO'] as const;

type ClaveChip = 'fechas' | 'medico' | 'paciente' | 'estado';

export interface ChipFiltro {
  readonly clave: ClaveChip;
  readonly etiqueta: string;
  readonly ariaQuitar: string;
  readonly estado?: EstadoReserva;
}

interface OpcionMedico {
  readonly label: string;
  readonly value: number;
}

interface OpcionEstado {
  readonly label: string;
  readonly value: EstadoReserva;
}

interface BorradorFiltros {
  readonly rangoFechas: Date[] | null;
  readonly idMedico: number | null;
  readonly estados: EstadoReserva[];
}

const BORRADOR_VACIO: BorradorFiltros = {
  rangoFechas: null,
  idMedico: null,
  estados: [],
};

const TEXTOS_FALLO_CANCELACION: TextosFalloHttp = {
  desincronizado: 'El turno cambió de estado. Actualizamos el listado de turnos.',
  sinPermiso: 'No tenés permiso para cancelar este turno.',
  generico: 'No pudimos cancelar el turno. Por favor, reintentá.',
};

export const OPCIONES_ESTADO: readonly OpcionEstado[] = [
  { label: 'Reservado', value: 'ACTIVO' },
  { label: 'Atendido', value: 'ATENDIDO' },
  { label: 'Ausente', value: 'AUSENTE' },
  { label: 'Cancelado', value: 'CANCELADO' },
];

const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  ACTIVO: 'Reservado',
  ATENDIDO: 'Atendido',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
};

const CAMPOS_ORDEN: Record<string, CampoOrdenReservasAdmin> = {
  fechaHora: 'fechaHora',
  paciente: 'paciente',
  medico: 'medico',
  valorConsulta: 'valorConsulta',
  estado: 'estado',
};

const LIMITE_INICIAL = 10;

function normalizarRango(rango: Date[] | null | undefined): Date[] | null {
  if (!rango || rango.length === 0) {
    return null;
  }

  const fechasValidas = rango.filter(
    (fecha): fecha is Date => fecha instanceof Date && !Number.isNaN(fecha.getTime()),
  );

  return fechasValidas.length === 0 ? null : fechasValidas;
}

@Component({
  selector: 'app-admin-turnos',
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    Button,
    Checkbox,
    DatePicker,
    NgTemplateOutlet,
    Drawer,
    IconField,
    InputIcon,
    InputText,
    Select,
    Skeleton,
    TableModule,
    Tooltip,
    EstadoBadge,
    EmptyState,
    DocumentoPipe,
    CancelarTurnoDialog,
  ],
  templateUrl: './admin-turnos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminTurnos implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly medicosService = inject(MedicosService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rutaReservar = RUTAS.RESERVA_ADMIN;

  protected readonly reservas = signal<ReservaAdminResponse[]>([]);
  protected readonly total = signal<number>(0);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly medicos = signal<MedicoListItem[]>([]);
  protected readonly cargandoMedicos = signal<boolean>(false);
  protected readonly drawerFiltrosVisible = signal<boolean>(false);

  protected readonly rangoFechas = signal<Date[] | null>(null);
  protected readonly idMedico = signal<number | null>(null);
  protected readonly estados = signal<EstadoReserva[]>([]);
  protected readonly busqueda = signal<string>('');
  protected readonly pagina = signal<number>(1);
  protected readonly limite = signal<number>(LIMITE_INICIAL);
  protected readonly ordenarPor = signal<CampoOrdenReservasAdmin>('fechaHora');
  protected readonly direccion = signal<DireccionOrden>('DESC');
  private readonly refresco = signal<number>(0);

  protected readonly ahora = signal<Date>(new Date());
  protected readonly turnoACancelar = signal<ReservaAdminResponse | null>(null);
  protected readonly modalCancelacionVisible = signal<boolean>(false);
  protected readonly cancelando = signal<boolean>(false);

  protected readonly evaluarCancelacionAdministrativa = evaluarCancelacionAdministrativa;
  protected readonly motivoCancelacionIniciada = MOTIVO_CANCELACION_INICIADA;

  // señales temporales para el drawer en mobile
  protected readonly borrador = signal<BorradorFiltros>(BORRADOR_VACIO);

  private readonly INPUT_DEBOUNCE_TIME = 500;

  protected readonly busquedaControl = new FormControl('', { nonNullable: true });

  protected readonly opcionesEstado = [
    { label: 'Todos', value: null },
    ...OPCIONES_ESTADO.map((opcion) => ({ label: opcion.label, value: opcion.value })),
  ];
  protected readonly opcionesEstadoDrawer = OPCIONES_ESTADO;

  protected readonly opcionesMedicos = computed<OpcionMedico[]>(() =>
    this.medicos().map((medico) => ({
      label: `${medico.apellidos}, ${medico.nombres}`,
      value: medico.id,
    })),
  );

  protected readonly estadoSeleccionado = computed<EstadoReserva | null>(() => {
    const seleccionados = this.estados();
    return seleccionados.length === 1 ? seleccionados[0] : null;
  });

  protected readonly primerRegistro = computed<number>(() => (this.pagina() - 1) * this.limite());

  protected readonly hayFiltros = computed<boolean>(() => this.chips().length > 0);
  protected readonly hayFiltrosBorrador = computed<boolean>(() => {
    const { estados, idMedico, rangoFechas } = this.borrador();
    return (
      (rangoFechas !== null && rangoFechas.length > 0) || idMedico !== null || estados.length > 0
    );
  });

  protected readonly filtros = computed<FiltrosReservasAdmin>(() => {
    const rango = this.rangoFechas();
    const desde = rango?.[0] ? obtenerFechaLocalIso(rango[0]) : '';
    const hasta = rango?.[1] ? obtenerFechaLocalIso(rango[1]) : desde;
    const busqueda = this.busqueda().trim();
    const estados = this.estados();

    return {
      fechaDesde: desde || undefined,
      fechaHasta: hasta || undefined,
      idMedico: this.idMedico() ?? undefined,
      busquedaPaciente: busqueda || undefined,
      estado: estados.length > 0 ? estados : undefined,
      pagina: this.pagina(),
      limite: this.limite(),
      ordenarPor: this.ordenarPor(),
      direccion: this.direccion(),
    };
  });

  private readonly solicitud = computed(() => ({
    filtros: this.filtros(),
    refresco: this.refresco(),
  }));

  protected readonly chips = computed<ChipFiltro[]>(() => {
    const chips: ChipFiltro[] = [];

    const rango = this.rangoFechas();
    if (rango?.[0]) {
      const desdeIso = obtenerFechaLocalIso(rango[0]);
      const hastaIso = rango[1] ? obtenerFechaLocalIso(rango[1]) : desdeIso;
      const etiqueta =
        desdeIso === hastaIso
          ? `Fecha: ${formatearFechaCorta(desdeIso)}`
          : `Fechas: ${formatearFechaCorta(desdeIso)} al ${formatearFechaCorta(hastaIso)}`;
      chips.push({
        clave: 'fechas',
        etiqueta,
        ariaQuitar: `Quitar filtro ${etiqueta}`,
      });
    }

    const idMedico = this.idMedico();
    if (idMedico !== null) {
      const medico = this.medicos().find((item) => item.id === idMedico);
      const etiqueta = medico
        ? `Médico: ${medico.apellidos}, ${medico.nombres}`
        : `Médico: #${idMedico}`;
      chips.push({
        clave: 'medico',
        etiqueta,
        ariaQuitar: `Quitar filtro ${etiqueta}`,
      });
    }

    const busqueda = this.busqueda().trim();
    if (busqueda) {
      const etiqueta = `Paciente: ${busqueda}`;
      chips.push({
        clave: 'paciente',
        etiqueta,
        ariaQuitar: `Quitar filtro ${etiqueta}`,
      });
    }

    for (const estado of this.estados()) {
      const etiqueta = `Estado: ${ETIQUETA_ESTADO[estado]}`;
      chips.push({
        clave: 'estado',
        estado,
        etiqueta,
        ariaQuitar: `Quitar filtro ${etiqueta}`,
      });
    }

    return chips;
  });

  private readonly LONGITUD_MINIMA_BUSQUEDA = 3;

  constructor() {
    this.busquedaControl.valueChanges
      .pipe(
        debounceTime(this.INPUT_DEBOUNCE_TIME),
        map((valor) => {
          const limpio = valor.trim();
          return limpio.length >= this.LONGITUD_MINIMA_BUSQUEDA ? limpio : '';
        }),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((valor) => {
        this.busqueda.set(valor);
        this.pagina.set(1);
      });

    toObservable(this.solicitud)
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ filtros }) =>
          this.reservasService.obtenerTodasLasReservas(filtros).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar el listado de turnos.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        if (respuesta) {
          this.reservas.set(respuesta.data);
          this.total.set(respuesta.meta.total);
          this.ahora.set(new Date());
        } else {
          this.reservas.set([]);
          this.total.set(0);
        }
        this.cargando.set(false);
      });
  }

  ngOnInit(): void {
    this.cargarMedicos();
  }

  protected formatearFechaHora(fechaHora: string): string {
    return formatearFechaHoraClinica(fechaHora);
  }

  protected cambiarRango(rango: Date[] | null): void {
    this.rangoFechas.set(normalizarRango(rango));
    this.pagina.set(1);
  }
  protected cambiarRangoFechaBorrador(rango: Date[] | null): void {
    this.borrador.update((borrador) => ({
      ...borrador,
      rangoFechas: normalizarRango(rango),
    }));
  }

  protected cambiarMedico(idMedico: number | null | undefined): void {
    this.idMedico.set(idMedico ?? null);
    this.pagina.set(1);
  }

  protected cambiarEstadoSeleccionado(estado: EstadoReserva | null | undefined): void {
    this.estados.set(estado ? [estado] : []);
    this.pagina.set(1);
  }

  protected estaEstadoSeleccionado(estado: EstadoReserva): boolean {
    return this.borrador().estados.includes(estado);
  }

  protected alternarEstado(estado: EstadoReserva, marcado: boolean): void {
    this.estados.update((actuales) =>
      marcado
        ? [...actuales.filter((item) => item !== estado), estado]
        : actuales.filter((item) => item !== estado),
    );
    this.pagina.set(1);
  }

  protected cambiarPagina(evento: { first: number; rows: number }): void {
    this.limite.set(evento.rows);
    this.pagina.set(Math.floor(evento.first / evento.rows) + 1);
  }

  protected cambiarOrden(evento: { field?: string | null; order?: number | null }): void {
    const campo = evento.field ? CAMPOS_ORDEN[evento.field] : undefined;
    if (!campo) {
      return;
    }

    this.ordenarPor.set(campo);
    this.direccion.set(evento.order === 1 ? 'ASC' : 'DESC');
    this.pagina.set(1);
  }

  protected quitarFiltro(chip: ChipFiltro): void {
    switch (chip.clave) {
      case 'fechas':
        this.rangoFechas.set(null);
        break;
      case 'medico':
        this.idMedico.set(null);
        break;
      case 'paciente':
        this.busquedaControl.setValue('', { emitEvent: false });
        this.busqueda.set('');
        break;
      case 'estado':
        if (chip.estado) {
          this.estados.update((actuales) => actuales.filter((estado) => estado !== chip.estado));
        }
        break;
    }
    this.pagina.set(1);
  }

  protected limpiarFiltros(): void {
    this.rangoFechas.set(null);
    this.idMedico.set(null);
    this.estados.set([]);
    this.busquedaControl.setValue('', { emitEvent: false });
    this.busqueda.set('');
    this.pagina.set(1);
  }

  protected abrirDrawerFiltros(): void {
    this.borrador.set({
      rangoFechas: this.rangoFechas(),
      idMedico: this.idMedico(),
      estados: [...this.estados()],
    });
    this.drawerFiltrosVisible.set(true);
  }
  protected aplicarFiltrosDrawer(): void {
    const { rangoFechas, idMedico, estados } = this.borrador();
    this.rangoFechas.set(rangoFechas);
    this.idMedico.set(idMedico);
    this.estados.set(estados);
    this.pagina.set(1);
    this.drawerFiltrosVisible.set(false);
  }

  protected limpiarFiltrosDrawer(): void {
    this.borrador.set(BORRADOR_VACIO);
  }

  protected cambiarMedicoBorrador(idMedico: number | null | undefined): void {
    this.borrador.update((actual) => ({ ...actual, idMedico: idMedico ?? null }));
  }

  protected alternarEstadoBorrador(estado: EstadoReserva, marcado: boolean): void {
    this.borrador.update((actual) => ({
      ...actual,
      estados: marcado
        ? [...actual.estados.filter((item) => item !== estado), estado]
        : actual.estados.filter((item) => item !== estado),
    }));
  }

  protected recargar(): void {
    this.refresco.update((valor) => valor + 1);
  }

  protected abrirModalCancelacion(reserva: ReservaAdminResponse): void {
    this.turnoACancelar.set(reserva);
    this.modalCancelacionVisible.set(true);
  }

  protected cerrarModalCancelacion(): void {
    if (this.cancelando()) {
      return;
    }
    this.modalCancelacionVisible.set(false);
    this.turnoACancelar.set(null);
  }

  protected etiquetaCancelar(reserva: ReservaAdminResponse): string {
    return `Cancelar el turno de ${reserva.paciente.nombres} ${reserva.paciente.apellidos} el ${this.formatearFechaHora(reserva.fechaHora)}`;
  }

  protected confirmarCancelacion(): void {
    const turno = this.turnoACancelar();
    if (!turno) {
      return;
    }

    this.cancelando.set(true);
    this.reservasService
      .cancelarReserva(turno.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cancelando.set(false)),
      )
      .subscribe({
        next: (reservaCancelada) => {
          this.reservas.update((actuales) =>
            actuales.map((reserva) =>
              reserva.id === reservaCancelada.id
                ? { ...reserva, estado: reservaCancelada.estado }
                : reserva,
            ),
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Turno cancelado',
            detail: 'El turno fue cancelado correctamente.',
          });
          this.modalCancelacionVisible.set(false);
          this.turnoACancelar.set(null);
        },
        error: (error: unknown) => {
          const fallo = clasificarFalloHttp(error, TEXTOS_FALLO_CANCELACION);
          this.messageService.add({
            severity: 'error',
            summary: fallo.requiereRecargar ? 'Turno no disponible' : 'Error al cancelar',
            detail: fallo.mensaje,
          });
          if (fallo.requiereRecargar) {
            this.cerrarModalCancelacion();
            this.recargar();
          }
        },
      });
  }

  private cargarMedicos(): void {
    this.cargandoMedicos.set(true);
    this.medicosService
      .obtenerMedicos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (medicos) => {
          this.medicos.set(medicos);
          this.cargandoMedicos.set(false);
        },
        error: () => {
          this.cargandoMedicos.set(false);
        },
      });
  }
}
