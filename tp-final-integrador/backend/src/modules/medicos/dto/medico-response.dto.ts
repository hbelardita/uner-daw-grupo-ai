import { ApiProperty } from '@nestjs/swagger';
import { Medico } from '../entities/medico.entity.js';

export class MedicoResponseDto {
  @ApiProperty({
    description: 'Identificador único del registro médico',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número de matrícula profesional',
    example: 1001,
  })
  matricula: number;

  @ApiProperty({
    description: 'Valor de consulta vigente',
    example: 5000,
  })
  valorConsulta: number;

  @ApiProperty({
    description: 'Nombres del profesional',
    example: 'Ana',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del profesional',
    example: 'Gomez',
  })
  apellidos: string;

  static fromEntity(medico: Medico): MedicoResponseDto {
    const dto = new MedicoResponseDto();
    dto.id = medico.id;
    dto.matricula = medico.matricula;
    dto.valorConsulta = medico.valorConsulta;
    dto.nombres = medico.usuario.nombres;
    dto.apellidos = medico.usuario.apellidos;
    return dto;
  }
}
