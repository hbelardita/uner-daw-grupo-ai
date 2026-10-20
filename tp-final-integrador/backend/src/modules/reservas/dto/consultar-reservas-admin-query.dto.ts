import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoReserva } from '../enums/index.js';

export const PAGINACION_ADMIN_DEFAULTS = {
  PAGINA: 1,
  LIMITE: 10,
} as const;
export const BUSQUEDA_PACIENTE_MAX_LONGITUD = 100;
export const CAMPOS_ORDEN_RESERVAS_ADMIN = [
  'fechaHora',
  'paciente',
  'medico',
  'valorConsulta',
  'estado',
] as const;
export type CampoOrdenReservasAdmin =
  (typeof CAMPOS_ORDEN_RESERVAS_ADMIN)[number];
export const DIRECCIONES_ORDEN = ['ASC', 'DESC'] as const;
export type DireccionOrden = (typeof DIRECCIONES_ORDEN)[number];

function transformarNumeroOpcional({ value }: TransformFnParams): unknown {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  return typeof value === 'number' ? value : Number(value);
}

function transformarTextoOpcional({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const texto = value.trim();
  return texto === '' ? undefined : texto;
}
export class ConsultarReservasAdminQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por fecha en formato AAAA-MM-DD. Equivale a un rango de un solo día y no puede combinarse con fechaDesde ni fechaHasta.',
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
    description:
      'Fecha inicial (inclusive) del rango de búsqueda en formato AAAA-MM-DD',
    example: '2026-11-01',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'La fecha desde debe ser una fecha de calendario válida.' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha desde debe tener formato AAAA-MM-DD.',
  })
  fechaDesde?: string;

  @ApiPropertyOptional({
    description:
      'Fecha final (inclusive) del rango de búsqueda en formato AAAA-MM-DD',
    example: '2026-11-30',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'La fecha hasta debe ser una fecha de calendario válida.' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha hasta debe tener formato AAAA-MM-DD.',
  })
  fechaHasta?: string;

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
    description:
      'Búsqueda parcial por documento, apellido o nombre del paciente',
    example: 'Fernandez',
    maxLength: BUSQUEDA_PACIENTE_MAX_LONGITUD,
  })
  @Transform(transformarTextoOpcional)
  @IsOptional()
  @IsString({ message: 'La búsqueda de paciente debe ser un texto.' })
  @MaxLength(BUSQUEDA_PACIENTE_MAX_LONGITUD, {
    message: `La búsqueda de paciente no puede superar los ${BUSQUEDA_PACIENTE_MAX_LONGITUD} caracteres.`,
  })
  busquedaPaciente?: string;

  @ApiPropertyOptional({
    description:
      'Filtro por estado de la reserva. Admite un valor, valores separados por coma o el parámetro repetido.',
    enum: EstadoReserva,
    enumName: 'EstadoReserva',
    isArray: true,
    example: EstadoReserva.ACTIVO,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const valores = Array.isArray(value) ? value : String(value).split(',');
    const estados = valores
      .map((valor) => String(valor).trim().toUpperCase())
      .filter((valor) => valor !== '');

    return estados.length === 0 ? undefined : estados;
  })
  @IsOptional()
  @IsEnum(EstadoReserva, {
    each: true,
    message:
      'El estado debe ser uno de los valores válidos: ACTIVO, ATENDIDO, AUSENTE, CANCELADO.',
  })
  estado?: EstadoReserva[];

  @ApiPropertyOptional({
    description: 'Número de página a consultar (comenzando en 1)',
    example: 1,
    default: PAGINACION_ADMIN_DEFAULTS.PAGINA,
  })
  @Transform(transformarNumeroOpcional)
  @IsOptional()
  @IsInt({ message: 'El parámetro pagina debe ser un número entero.' })
  @Min(1, { message: 'El parámetro pagina debe ser mayor o igual a 1.' })
  @Max(10000, { message: 'El parámetro pagina no puede superar 10000.' })
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
  @Max(100, { message: 'El parámetro limite no puede superar 100.' })
  limite?: number;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar el listado',
    enum: CAMPOS_ORDEN_RESERVAS_ADMIN,
    enumName: 'CampoOrdenReservasAdmin',
    default: 'fechaHora',
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsOptional()
  @IsIn(CAMPOS_ORDEN_RESERVAS_ADMIN, {
    message: `El orden debe ser uno de los valores válidos: ${CAMPOS_ORDEN_RESERVAS_ADMIN.join(', ')}.`,
  })
  ordenarPor?: CampoOrdenReservasAdmin;

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: DIRECCIONES_ORDEN,
    enumName: 'DireccionOrden',
    default: 'ASC',
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== ''
      ? value.trim().toUpperCase()
      : undefined,
  )
  @IsOptional()
  @IsIn(DIRECCIONES_ORDEN, {
    message: 'La dirección del orden debe ser ASC o DESC.',
  })
  direccion?: DireccionOrden;
}
