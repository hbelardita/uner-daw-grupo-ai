import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BuscarPacientesQueryDto {
  @ApiProperty({
    example: 'García',
    description: 'Texto a buscar en nombres o apellidos del paciente.',
  })
  @IsString()
  @IsNotEmpty()
  busqueda: string;
}
