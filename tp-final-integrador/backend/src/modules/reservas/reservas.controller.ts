import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, CurrentUser, type JwtPayload } from '../auth/index.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { ActualizarEstadoReservaDto, ReservaResponseDto } from './dto/index.js';
import { ReservasService } from './reservas.service.js';

@ApiTags('Reservas')
@Controller('reservas')
@Auth(RolUsuario.MEDICO)
@ApiBearerAuth()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Registrar la asistencia médica de un turno propio',
    description:
      'Permite al médico registrar la asistencia (ATENDIDO o AUSENTE) de un turno propio en estado ACTIVO una vez alcanzada la fecha y hora pactada.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Identificador único de la reserva',
  })
  @ApiBody({ type: ActualizarEstadoReservaDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado de la reserva actualizado exitosamente.',
    type: ReservaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Cuerpo de la petición inválido o intento de registrar asistencia antes de la hora pactada.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'El turno pertenece a otro profesional médico.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No existe una reserva con el identificador indicado.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'La reserva no se encuentra en estado ACTIVO (ya ATENDIDO, AUSENTE o CANCELADO).',
  })
  async actualizarEstado(
    @Param('id', ParseIntPipe) idReserva: number,
    @Body() body: ActualizarEstadoReservaDto,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<ReservaResponseDto> {
    const reserva = await this.reservasService.actualizarEstado(
      idReserva,
      usuario.idMedico,
      body.estado,
    );
    return ReservaResponseDto.fromEntity(reserva);
  }
}
