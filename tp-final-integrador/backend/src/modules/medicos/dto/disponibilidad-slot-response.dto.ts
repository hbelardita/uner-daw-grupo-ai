import { ApiProperty } from '@nestjs/swagger';

export class DisponibilidadSlotResponseDto {
  @ApiProperty({
    description:
      'Instante del slot en formato ISO 8601 UTC (la hora local de la clínica America/Argentina/Buenos_Aires convertida a UTC).',
    example: '2026-10-15T11:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  fechaHora: string;

  @ApiProperty({
    description:
      'Indica si el horario está libre (true) u ocupado/bloqueado (false).',
    example: true,
  })
  disponible: boolean;
}
