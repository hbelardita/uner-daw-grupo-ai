import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Raw, Repository } from 'typeorm';
import { MedicosService } from '../medicos/medicos.service.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import {
  validarAntelacionCancelacion,
  validarCancelacionAdministrador,
  validarReglasCreacionReserva,
} from './domain/reglas-temporales.js';
import { Reserva } from './entities/reserva.entity.js';
import { EstadoReserva } from './enums/index.js';
import { PAGINACION_ADMIN_DEFAULTS } from './dto/index.js';

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
  idMedico?: number;
  idPaciente?: number;
  documentoPaciente?: string;
  estado?: EstadoReserva;
  pagina?: number;
  limite?: number;
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

    const where: FindOptionsWhere<Reserva> = {};

    if (filtros.fecha) {
      where.fechaHora = Raw((alias) => `DATE(${alias}) = :fecha`, {
        fecha: filtros.fecha,
      });
    }

    if (filtros.idMedico !== undefined) {
      where.idMedico = filtros.idMedico;
    }

    if (filtros.idPaciente !== undefined) {
      where.idPaciente = filtros.idPaciente;
    }

    if (filtros.documentoPaciente) {
      where.paciente = { documento: filtros.documentoPaciente };
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    const [data, total] = await this.reservasRepository.findAndCount({
      where,
      relations: {
        medico: {
          usuario: true,
        },
        paciente: true,
      },
      order: {
        fechaHora: 'ASC',
        id: 'ASC',
      },
      skip,
      take: limite,
    });

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
