import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CrearReservaRequestDto {
  @ApiProperty({
    description: 'Identificador único del médico con quien se reserva el turno',
    example: 1,
  })
  @IsInt({ message: 'El campo idMedico debe ser un número entero' })
  @IsPositive({
    message:
      'El campo idMedico debe ser un número entero positivo mayor a cero',
  })
  @IsNotEmpty({ message: 'El campo idMedico es obligatorio' })
  idMedico: number;

  @ApiProperty({
    description:
      'Fecha y hora de inicio de la consulta en formato ISO 8601 (minutos y segundos en 00)',
    example: '2026-10-15T10:00:00.000Z',
  })
  @IsISO8601(
    { strict: true },
    { message: 'El campo fechaHora debe ser una cadena ISO 8601 válida' },
  )
  @IsNotEmpty({ message: 'El campo fechaHora es obligatorio' })
  fechaHora: string;

  @ApiPropertyOptional({
    description:
      'Identificador único del paciente (requerido únicamente si la reserva es asistida por un Administrador)',
    example: 5,
  })
  @IsOptional()
  @IsInt({ message: 'El campo idPaciente debe ser un número entero' })
  @IsPositive({
    message:
      'El campo idPaciente debe ser un número entero positivo mayor a cero',
  })
  idPaciente?: number;
}
