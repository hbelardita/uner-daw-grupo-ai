import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class ActualizarValorConsultaDto {
  @ApiProperty({
    description:
      'Nuevo valor u honorario de la consulta del médico (entero > 0)',
    example: 5000,
  })
  @IsInt({ message: 'El campo valorConsulta debe ser un número entero' })
  @IsPositive({ message: 'El campo valorConsulta debe ser un número positivo' })
  @Min(1, {
    message: 'El campo valorConsulta debe ser estrictamente mayor a 0',
  })
  @IsNotEmpty({ message: 'El campo valorConsulta es obligatorio' })
  valorConsulta: number;
}
