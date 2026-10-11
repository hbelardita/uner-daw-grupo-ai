import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, Matches } from 'class-validator';

export class ConsultarAgendaQueryDto {
  @ApiProperty({
    example: '2026-09-26',
    description: 'Fecha de la agenda en formato AAAA-MM-DD.',
  })
  @IsNotEmpty()
  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;
}
