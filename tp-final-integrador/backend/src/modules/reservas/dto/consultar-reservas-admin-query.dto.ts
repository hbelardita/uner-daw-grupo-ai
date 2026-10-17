import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import { EstadoReserva } from '../enums/index.js';

export const PAGINACION_ADMIN_DEFAULTS = {
  PAGINA: 1,
  LIMITE: 10,
} as const;
function transformarNumeroOpcional({ value }: TransformFnParams): unknown {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  return typeof value === 'number' ? value : Number(value);
}
export class ConsultarReservasAdminQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro por fecha en formato AAAA-MM-DD',
    example: '2026-11-10',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'La fecha debe ser una fecha de calendario válida.' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato AAAA-MM-DD.',
  })
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Filtro por identificador del médico',
    example: 1,
  })
  @Transform(transformarNumeroOpcional)
  @IsOptional()
  @IsInt({ message: 'El idMedico debe ser un número entero.' })
  idMedico?: number;

  @ApiPropertyOptional({
    description: 'Identificador del paciente',
    example: 5,
  })
  @Transform(transformarNumeroOpcional)
  @IsOptional()
  @IsInt({ message: 'El idPaciente debe ser un número entero.' })
  idPaciente?: number;

  @ApiPropertyOptional({
    description: 'Filtro por documento del paciente',
    example: '30111111',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  documentoPaciente?: string;

  @ApiPropertyOptional({
    description: 'Filtro por estado de la reserva',
    enum: EstadoReserva,
    enumName: 'EstadoReserva',
    example: EstadoReserva.ACTIVO,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== ''
      ? (value.trim().toUpperCase() as EstadoReserva)
      : undefined,
  )
  @IsOptional()
  @IsEnum(EstadoReserva, {
    message:
      'El estado debe ser uno de los valores válidos: ACTIVO, ATENDIDO, AUSENTE, CANCELADO.',
  })
  estado?: EstadoReserva;

  @ApiPropertyOptional({
    description: 'Número de página a consultar (comenzando en 1)',
    example: 1,
    default: PAGINACION_ADMIN_DEFAULTS.PAGINA,
  })
  @Transform(transformarNumeroOpcional)
  @IsOptional()
  @IsInt({ message: 'El parámetro pagina debe ser un número entero.' })
  @Min(1, { message: 'El parámetro pagina debe ser mayor o igual a 1.' })
  pagina?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    default: PAGINACION_ADMIN_DEFAULTS.LIMITE,
  })
  @Transform(transformarNumeroOpcional)
  @IsOptional()
  @IsInt({ message: 'El parámetro limite debe ser un número entero.' })
  @Min(1, { message: 'El parámetro limite debe ser mayor o igual a 1.' })
  limite?: number;
}
