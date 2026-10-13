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
import {
  validarAntelacionCancelacion,
  validarReglasCreacionReserva,
} from './domain/reglas-temporales.js';
import { Reserva } from './entities/reserva.entity.js';
import { EstadoReserva } from './enums/index.js';

export interface CrearReservaParams {
  idMedico: number;
  idPaciente: number;
  fechaHora: Date;
}

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    private readonly medicosService: MedicosService,
  ) {}

  async crearReserva(dto: CrearReservaParams): Promise<Reserva> {
    this.validarReglasTemporales(dto.fechaHora);
    const valorConsulta = await this.medicosService.obtenerArancelVigente(
      dto.idMedico,
    );
    const reserva = this.reservasRepository.create({
      idMedico: dto.idMedico,
      idPaciente: dto.idPaciente,
      fechaHora: dto.fechaHora,
      estado: EstadoReserva.ACTIVO,
      valorConsulta,
    });
    return this.reservasRepository.save(reserva);
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
    idPacienteAutenticado: number,
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

    if (reserva.idPaciente !== idPacienteAutenticado) {
      throw new ForbiddenException(
        'Solo puede cancelar un turno propio del paciente autenticado.',
      );
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

    validarAntelacionCancelacion(fechaHoraTurno, ahora);

    reserva.estado = EstadoReserva.CANCELADO;
    return this.reservasRepository.save(reserva);
  }

  validarReglasTemporales(fechaHora: Date, ahora: Date = new Date()): void {
    validarReglasCreacionReserva(fechaHora, ahora);
  }
}
