import {
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, CurrentUser, type JwtPayload } from '../auth/index.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { ReservaResponseDto } from './dto/index.js';
import { ReservasService } from './reservas.service.js';

@ApiTags('Reservas')
@Controller('reservas')
@Auth(RolUsuario.MEDICO)
@ApiBearerAuth()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Patch(':id/atender')
  @ApiOperation({
    summary: 'Marcar un turno propio como atendido',
    description:
      'Cambia el estado de un turno propio de ACTIVO a ATENDIDO diez minutos después de su fecha y hora. Los turnos de otro médico, con otro estado o dentro de esos diez minutos no pueden modificarse.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno marcado como atendido.',
    type: ReservaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'El turno pertenece a otro profesional.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'El turno no está activo.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No existe un turno con el identificador indicado.',
  })
  async marcarComoAtendido(
    @Param('id', ParseIntPipe) idReserva: number,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<ReservaResponseDto> {
    const reserva = await this.reservasService.marcarComoAtendido(
      idReserva,
      usuario.idMedico,
    );
    return ReservaResponseDto.fromEntity(reserva);
  }
}
