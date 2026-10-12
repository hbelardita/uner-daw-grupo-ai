import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { EstadoReserva } from '../enums/estado-reserva.enum.js';

export class ActualizarEstadoReservaDto {
  @ApiProperty({
    description: 'Nuevo estado de asistencia del turno',
    enum: [EstadoReserva.ATENDIDO, EstadoReserva.AUSENTE],
    example: EstadoReserva.ATENDIDO,
  })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsIn([EstadoReserva.ATENDIDO, EstadoReserva.AUSENTE], {
    message: 'El estado debe ser estrictamente ATENDIDO o AUSENTE.',
  })
  estado: EstadoReserva.ATENDIDO | EstadoReserva.AUSENTE;
}
