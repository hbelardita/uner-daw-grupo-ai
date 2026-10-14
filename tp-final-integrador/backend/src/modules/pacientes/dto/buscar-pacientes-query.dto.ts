import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BuscarPacientesQueryDto {
  @ApiProperty({
    examples: {
      'nombre o apellido': {
        value: 'Juan',
      },
      documento: {
        value: '10111111',
      },
    },
    description:
      'Texto a buscar en nombres, apellidos o documento del paciente.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  busqueda: string;
}
