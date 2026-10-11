import { ApiProperty } from '@nestjs/swagger';
import { Reserva } from '../../reservas/entities/reserva.entity.js';
import { EstadoReserva } from '../../reservas/enums/estado-reserva.enum.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export class PacienteResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: '30111111' })
  documento: string;

  @ApiProperty({ example: 'Julia' })
  nombres: string;

  @ApiProperty({ example: 'Fernandez' })
  apellidos: string;

  @ApiProperty({ example: 'julia.fernandez@mail.test' })
  email: string;

  static fromEntity(usuario: Usuario): PacienteResponseDto {
    const respuesta = new PacienteResponseDto();
    respuesta.id = usuario.id;
    respuesta.documento = usuario.documento;
    respuesta.nombres = usuario.nombres;
    respuesta.apellidos = usuario.apellidos;
    respuesta.email = usuario.email;
    return respuesta;
  }
}

export class ReservaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '2026-09-26T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  fechaHora: Date;

  @ApiProperty({ enum: EstadoReserva, example: EstadoReserva.ACTIVO })
  estado: EstadoReserva;

  @ApiProperty({ example: 15000 })
  valorConsulta: number;

  @ApiProperty({ type: PacienteResponseDto })
  paciente: PacienteResponseDto;

  static fromEntity(reserva: Reserva): ReservaResponseDto {
    const respuesta = new ReservaResponseDto();
    respuesta.id = reserva.id;
    respuesta.fechaHora = reserva.fechaHora;
    respuesta.estado = reserva.estado;
    respuesta.valorConsulta = reserva.valorConsulta;
    respuesta.paciente = PacienteResponseDto.fromEntity(reserva.paciente);
    return respuesta;
  }
}
