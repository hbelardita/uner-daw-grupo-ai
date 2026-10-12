import { ApiProperty } from '@nestjs/swagger';
import { EstadoReserva } from '../enums/index.js';
import type { Reserva } from '../entities/reserva.entity.js';

export class MedicoHistorialResponseDto {
  @ApiProperty({
    description: 'Identificador único del médico',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombres del profesional médico',
    example: 'Ana',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del profesional médico',
    example: 'Gomez',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Número de matrícula profesional habilitante',
    example: 1001,
  })
  matricula: number;
}

export class HistorialReservaResponseDto {
  @ApiProperty({
    description: 'Identificador único de la reserva',
    example: 1,
  })
  id: number;

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
    example: 5000,
  })
  valorConsulta: number;

  @ApiProperty({
    description: 'Datos del médico asignado a la consulta',
    type: MedicoHistorialResponseDto,
  })
  medico: MedicoHistorialResponseDto;

  static fromEntity(reserva: Reserva): HistorialReservaResponseDto {
    const dto = new HistorialReservaResponseDto();
    dto.id = reserva.id;
    dto.fechaHora =
      reserva.fechaHora instanceof Date
        ? reserva.fechaHora.toISOString()
        : new Date(reserva.fechaHora).toISOString();
    dto.estado = reserva.estado;
    dto.valorConsulta = reserva.valorConsulta;
    dto.medico = {
      id: reserva.medico.id,
      nombres: reserva.medico.usuario.nombres,
      apellidos: reserva.medico.usuario.apellidos,
      matricula: reserva.medico.matricula,
    };
    return dto;
  }
}
