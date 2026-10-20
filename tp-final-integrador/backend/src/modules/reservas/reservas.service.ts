import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicosService } from '../medicos/medicos.service.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import {
  validarAntelacionCancelacion,
  validarCancelacionAdministrador,
  validarReglasCreacionReserva,
} from './domain/reglas-temporales.js';
import {
  PAGINACION_ADMIN_DEFAULTS,
  type CampoOrdenReservasAdmin,
  type DireccionOrden,
} from './dto/index.js';
import { Reserva } from './entities/reserva.entity.js';
import { EstadoReserva } from './enums/index.js';

export interface UsuarioSolicitante {
  idUsuario: number;
  rol: RolUsuario;
}

export interface CrearReservaParams {
  idMedico: number;
  idPaciente?: number;
  fechaHora: Date;
  solicitante: UsuarioSolicitante;
}

export interface FiltrosListarReservasAdmin {
  fecha?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  idMedico?: number;
  idPaciente?: number;
  documentoPaciente?: string;
  busquedaPaciente?: string;
  estado?: EstadoReserva[];
  pagina?: number;
  limite?: number;
  ordenarPor?: CampoOrdenReservasAdmin;
  direccion?: DireccionOrden;
}

export interface ReservasAdminPaginadasResultado {
  data: Reserva[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

function escaparLike(termino: string): string {
  return termino.replace(/[%_\\]/g, '\\$&');
}

function sumarUnDia(fechaIso: string): string {
  const fecha = new Date(`${fechaIso}T00:00:00.000Z`);
  fecha.setUTCDate(fecha.getUTCDate() + 1);
  return fecha.toISOString().slice(0, 10);
}

const MAPA_ORDEN_RESERVAS_ADMIN: Record<
  CampoOrdenReservasAdmin,
  readonly string[]
> = {
  fechaHora: ['reserva.fechaHora'],
  paciente: ['paciente.apellidos', 'paciente.nombres'],
  medico: ['medicoUsuario.apellidos', 'medicoUsuario.nombres'],
  valorConsulta: ['reserva.valorConsulta'],
  estado: ['reserva.estado'],
};

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    private readonly medicosService: MedicosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crearReserva(dto: CrearReservaParams): Promise<Reserva> {
    this.validarReglasTemporales(dto.fechaHora);
    const idPaciente = await this.resolverYValidarPacienteDestino(dto);
    const valorConsulta = await this.medicosService.obtenerArancelVigente(
      dto.idMedico,
    );
    const reserva = this.reservasRepository.create({
      idMedico: dto.idMedico,
      idPaciente,
      fechaHora: dto.fechaHora,
      estado: EstadoReserva.ACTIVO,
      valorConsulta,
    });
    return this.reservasRepository.save(reserva);
  }

  /**
   * Resuelve y valida el paciente destino según el rol del solicitante:
   * - Si es PACIENTE: se asigna a sí mismo (idUsuario del token). Si envía un
   *   idPaciente diferente al suyo, se rechaza la solicitud.
   * - Si es ADMINISTRADOR: idPaciente es obligatorio en el payload y debe
   *   corresponder a un usuario existente con rol PACIENTE y estado ACTIVO.
   */
  private async resolverYValidarPacienteDestino(
    dto: CrearReservaParams,
  ): Promise<number> {
    if (dto.solicitante.rol === RolUsuario.PACIENTE) {
      if (
        dto.idPaciente !== undefined &&
        dto.idPaciente !== dto.solicitante.idUsuario
      ) {
        throw new BadRequestException(
          'Un paciente no puede reservar turnos para otro paciente.',
        );
      }
      return dto.solicitante.idUsuario;
    }

    if (dto.solicitante.rol === RolUsuario.ADMINISTRADOR) {
      if (typeof dto.idPaciente !== 'number') {
        throw new BadRequestException(
          'El administrador debe indicar el idPaciente del paciente destino.',
        );
      }

      const paciente = await this.usuariosService.buscarPorId(dto.idPaciente);

      if (!paciente) {
        throw new NotFoundException(
          `No se encontró ningún usuario con id ${dto.idPaciente} para asignar el turno.`,
        );
      }

      if (paciente.rol !== RolUsuario.PACIENTE) {
        throw new NotFoundException(
          `El usuario con id ${dto.idPaciente} no tiene rol PACIENTE y no puede recibir turnos.`,
        );
      }

      if (paciente.estado !== EstadoUsuario.ACTIVO) {
        throw new NotFoundException(
          `El paciente con id ${dto.idPaciente} no se encuentra activo.`,
        );
      }

      return dto.idPaciente;
    }

    throw new ForbiddenException('Rol no autorizado para crear reservas.');
  }

  async buscarReservasPorPaciente(idPaciente: number): Promise<Reserva[]> {
    return this.reservasRepository.find({
      where: { idPaciente },
      relations: {
        medico: {
          usuario: true,
        },
      },
      order: { fechaHora: 'DESC' },
    });
  }

  async listarReservasAdmin(
    filtros: FiltrosListarReservasAdmin = {},
  ): Promise<ReservasAdminPaginadasResultado> {
    const pagina = filtros.pagina ?? PAGINACION_ADMIN_DEFAULTS.PAGINA;
    const limite = filtros.limite ?? PAGINACION_ADMIN_DEFAULTS.LIMITE;
    const skip = (pagina - 1) * limite;

    // `fecha` equivale a un rango de un solo día.
    const usaRango =
      filtros.fechaDesde !== undefined || filtros.fechaHasta !== undefined;

    if (usaRango && filtros.fecha !== undefined) {
      throw new BadRequestException(
        'No se puede combinar el parámetro fecha con fechaDesde o fechaHasta.',
      );
    }

    const fechaDesde = filtros.fechaDesde ?? filtros.fecha;
    const fechaHasta = filtros.fechaHasta ?? filtros.fecha;

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta.',
      );
    }

    const consulta = this.reservasRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.medico', 'medico')
      .leftJoinAndSelect('medico.usuario', 'medicoUsuario')
      .leftJoinAndSelect('reserva.paciente', 'paciente');

    if (fechaDesde) {
      consulta.andWhere('reserva.fechaHora >= :fechaDesde', {
        fechaDesde: `${fechaDesde} 00:00:00`,
      });
    }

    if (fechaHasta) {
      consulta.andWhere('reserva.fechaHora < :fechaHastaExclusivo', {
        fechaHastaExclusivo: `${sumarUnDia(fechaHasta)} 00:00:00`,
      });
    }

    if (filtros.idMedico !== undefined) {
      consulta.andWhere('reserva.idMedico = :idMedico', {
        idMedico: filtros.idMedico,
      });
    }

    if (filtros.idPaciente !== undefined) {
      consulta.andWhere('reserva.idPaciente = :idPaciente', {
        idPaciente: filtros.idPaciente,
      });
    }

    if (filtros.documentoPaciente) {
      consulta.andWhere('paciente.documento = :documentoPaciente', {
        documentoPaciente: filtros.documentoPaciente,
      });
    }

    if (filtros.busquedaPaciente) {
      consulta.andWhere(
        '(paciente.documento ILIKE :busquedaPaciente OR paciente.apellidos ILIKE :busquedaPaciente OR paciente.nombres ILIKE :busquedaPaciente)',
        { busquedaPaciente: `%${escaparLike(filtros.busquedaPaciente)}%` },
      );
    }

    if (filtros.estado?.length) {
      consulta.andWhere('reserva.estado IN (:...estados)', {
        estados: filtros.estado,
      });
    }

    const columnasOrden =
      MAPA_ORDEN_RESERVAS_ADMIN[filtros.ordenarPor ?? 'fechaHora'];
    const direccion = filtros.direccion ?? 'ASC';
    const [primeraColumna, ...restoColumnas] = columnasOrden;

    consulta.orderBy(primeraColumna, direccion);
    for (const columna of restoColumnas) {
      consulta.addOrderBy(columna, direccion);
    }
    consulta.addOrderBy('reserva.id', direccion);

    const [data, total] = await consulta
      .skip(skip)
      .take(limite)
      .getManyAndCount();

    const totalPaginas = total === 0 ? 0 : Math.ceil(total / limite);

    return {
      data,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas,
      },
    };
  }

  async actualizarEstado(
    idReserva: number,
    idMedicoAutenticado: number | undefined,
    nuevoEstado: EstadoReserva.ATENDIDO | EstadoReserva.AUSENTE,
    ahora: Date = new Date(),
  ): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({
      where: { id: idReserva },
    });

    if (!reserva) {
      throw new NotFoundException(
        `No se encontró la reserva con id ${idReserva}.`,
      );
    }

    if (reserva.idMedico !== idMedicoAutenticado) {
      throw new ForbiddenException(
        'Solo puede modificar el estado de un turno asignado al médico autenticado.',
      );
    }

    if (reserva.estado !== EstadoReserva.ACTIVO) {
      throw new ConflictException(
        `Solo se puede modificar el estado de un turno en estado ACTIVO. El turno se encuentra en estado ${reserva.estado}.`,
      );
    }

    const fechaHoraTurno =
      reserva.fechaHora instanceof Date
        ? reserva.fechaHora
        : new Date(reserva.fechaHora);

    if (ahora.getTime() < fechaHoraTurno.getTime()) {
      throw new BadRequestException(
        'Solo se puede registrar la asistencia una vez llegada la hora del turno.',
      );
    }

    reserva.estado = nuevoEstado;
    return this.reservasRepository.save(reserva);
  }

  async cancelarReserva(
    idReserva: number,
    solicitante: UsuarioSolicitante | number,
    ahora: Date = new Date(),
  ): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({
      where: { id: idReserva },
    });

    if (!reserva) {
      throw new NotFoundException(
        `No se encontró la reserva con id ${idReserva}.`,
      );
    }

    const { idUsuario, rol } =
      typeof solicitante === 'number'
        ? { idUsuario: solicitante, rol: RolUsuario.PACIENTE }
        : solicitante;

    if (rol === RolUsuario.PACIENTE) {
      if (reserva.idPaciente !== idUsuario) {
        throw new ForbiddenException(
          'Solo puede cancelar un turno propio del paciente autenticado.',
        );
      }
    }

    if (reserva.estado !== EstadoReserva.ACTIVO) {
      throw new ConflictException(
        `Solo se puede cancelar un turno en estado ACTIVO. El turno se encuentra en estado ${reserva.estado}.`,
      );
    }

    const fechaHoraTurno =
      reserva.fechaHora instanceof Date
        ? reserva.fechaHora
        : new Date(reserva.fechaHora);

    if (rol === RolUsuario.ADMINISTRADOR) {
      validarCancelacionAdministrador(fechaHoraTurno, ahora);
    } else {
      validarAntelacionCancelacion(fechaHoraTurno, ahora);
    }

    reserva.estado = EstadoReserva.CANCELADO;
    return this.reservasRepository.save(reserva);
  }

  validarReglasTemporales(fechaHora: Date, ahora: Date = new Date()): void {
    validarReglasCreacionReserva(fechaHora, ahora);
  }
}
