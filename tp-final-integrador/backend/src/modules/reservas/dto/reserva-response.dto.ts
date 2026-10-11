import { ApiProperty } from '@nestjs/swagger';
import { EstadoReserva } from '../enums/index.js';
import type { Reserva } from '../entities/reserva.entity.js';

export class ReservaResponseDto {
  @ApiProperty({
    description: 'Identificador único de la reserva generada',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Identificador del médico asignado a la consulta',
    example: 1,
  })
  idMedico: number;

  @ApiProperty({
    description: 'Identificador del paciente asignado a la consulta',
    example: 5,
  })
  idPaciente: number;

  @ApiProperty({
    description: 'Fecha y hora de la consulta en formato ISO 8601',
    example: '2026-10-15T10:00:00.000Z',
  })
  fechaHora: string;

  @ApiProperty({
    description: 'Estado actual de la reserva',
    enum: EstadoReserva,
    enumName: 'EstadoReserva',
    example: EstadoReserva.ACTIVO,
  })
  estado: EstadoReserva;

  @ApiProperty({
    description:
      'Arancel o valor de la consulta congelado al momento de la reserva',
    example: 15000,
  })
  valorConsulta: number;

  static fromEntity(entity: Reserva): ReservaResponseDto {
    const dto = new ReservaResponseDto();
    dto.id = entity.id;
    dto.idMedico = entity.idMedico;
    dto.idPaciente = entity.idPaciente;
    dto.fechaHora =
      entity.fechaHora instanceof Date
        ? entity.fechaHora.toISOString()
        : new Date(entity.fechaHora).toISOString();
    dto.estado = entity.estado;
    dto.valorConsulta = entity.valorConsulta;
    return dto;
  }
}
