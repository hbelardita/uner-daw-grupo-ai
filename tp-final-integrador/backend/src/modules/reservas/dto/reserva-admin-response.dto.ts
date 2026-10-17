import { ApiProperty } from '@nestjs/swagger';
import { EstadoReserva } from '../enums/index.js';
import type { Reserva } from '../entities/reserva.entity.js';

export class MedicoReservaResponseDto {
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
    description: 'Matrícula profesional habilitante',
    example: 1001,
  })
  matricula: number;
}

export class PacienteReservaResponseDto {
  @ApiProperty({
    description: 'Identificador único del paciente',
    example: 5,
  })
  id: number;

  @ApiProperty({
    description: 'Nombres del paciente',
    example: 'Julia',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del paciente',
    example: 'Fernandez',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Documento nacional de identidad del paciente',
    example: '30111111',
  })
  documento: string;
}

export class ReservaAdminResponseDto {
  @ApiProperty({
    description: 'Identificador único de la reserva',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Fecha y hora de la consulta médica en formato ISO 8601',
    example: '2026-11-10T13:00:00.000Z',
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
      'Arancel o valor congelado de la consulta al momento de la reserva',
    example: 5000,
  })
  valorConsulta: number;

  @ApiProperty({
    description: 'Información del profesional médico asignado',
    type: MedicoReservaResponseDto,
  })
  medico: MedicoReservaResponseDto;

  @ApiProperty({
    description: 'Información del paciente titular del turno',
    type: PacienteReservaResponseDto,
  })
  paciente: PacienteReservaResponseDto;

  static fromEntity(reserva: Reserva): ReservaAdminResponseDto {
    const dto = new ReservaAdminResponseDto();
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
    dto.paciente = {
      id: reserva.paciente.id,
      nombres: reserva.paciente.nombres,
      apellidos: reserva.paciente.apellidos,
      documento: reserva.paciente.documento,
    };
    return dto;
  }
}

export class PaginacionMetaDto {
  @ApiProperty({
    description: 'Total global de registros que cumplen los filtros aplicados',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual consultada',
    example: 1,
  })
  pagina: number;

  @ApiProperty({
    description: 'Cantidad de registros por página solicitados',
    example: 10,
  })
  limite: number;

  @ApiProperty({
    description: 'Cantidad total de páginas disponibles',
    example: 3,
  })
  totalPaginas: number;
}

export class ReservasAdminPaginadasResponseDto {
  @ApiProperty({
    description:
      'Listado de reservas de la clínica correspondientes a la página solicitada',
    type: [ReservaAdminResponseDto],
  })
  data: ReservaAdminResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: PaginacionMetaDto,
  })
  meta: PaginacionMetaDto;
}
