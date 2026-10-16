import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BuscarPacientesQueryDto {
  @ApiProperty({
    required: false,

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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El parámetro q debe ser una cadena de texto.' })
  @IsOptional()
  busqueda?: string;
}
