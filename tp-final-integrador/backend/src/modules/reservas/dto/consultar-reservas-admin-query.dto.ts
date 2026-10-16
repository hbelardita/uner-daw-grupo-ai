import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { EstadoReserva } from '../enums/index.js';

export const PAGINACION_ADMIN_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
} as const;

export class ConsultarReservasAdminQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro por fecha en formato AAAA-MM-DD',
    example: '2026-11-10',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato AAAA-MM-DD.',
  })
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Filtro por identificador del médico',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt({ message: 'El idMedico debe ser un número entero.' })
  idMedico?: number;

  @ApiPropertyOptional({
    description: 'Identificador del paciente',
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt({ message: 'El idPaciente debe ser un número entero.' })
  idPaciente?: number;

  @ApiPropertyOptional({
    description: 'Filtro por documento del paciente',
    example: '30111111',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  documentoPaciente?: string;

  @ApiPropertyOptional({
    description: 'Filtro por estado de la reserva',
    enum: EstadoReserva,
    enumName: 'EstadoReserva',
    example: EstadoReserva.ACTIVO,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(EstadoReserva, {
    message:
      'El estado debe ser uno de los valores válidos: ACTIVO, ATENDIDO, AUSENTE, CANCELADO.',
  })
  estado?: EstadoReserva;

  @ApiPropertyOptional({
    description: 'Número de página a consultar (comenzando en 1)',
    example: 1,
    default: PAGINACION_ADMIN_DEFAULTS.PAGE,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt({ message: 'El parámetro page debe ser un número entero.' })
  @Min(1, { message: 'El parámetro page debe ser mayor o igual a 1.' })
  page?: number = PAGINACION_ADMIN_DEFAULTS.PAGE;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    default: PAGINACION_ADMIN_DEFAULTS.LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt({ message: 'El parámetro limit debe ser un número entero.' })
  @Min(1, { message: 'El parámetro limit debe ser mayor o igual a 1.' })
  limit?: number = PAGINACION_ADMIN_DEFAULTS.LIMIT;
}
