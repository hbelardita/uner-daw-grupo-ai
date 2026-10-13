import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import {
  ActualizarEstadoReservaDto,
  HistorialReservaResponseDto,
  ReservaResponseDto,
} from './dto/index.js';
import { ReservasService } from './reservas.service.js';

@ApiTags('Reservas')
@Controller('reservas')
@ApiBearerAuth()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get()
  @Auth(RolUsuario.PACIENTE)
  @ApiOperation({
    summary: 'Consultar el historial de turnos del paciente autenticado',
    description:
      'Devuelve el listado completo de reservas (en cualquier estado) asociadas al paciente autenticado, ordenadas cronológicamente de forma descendente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de reservas del paciente obtenido exitosamente.',
    type: [HistorialReservaResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso no permitido para el rol del usuario autenticado.',
  })
  async obtenerHistorialPaciente(
    @CurrentUser() usuario: JwtPayload,
  ): Promise<HistorialReservaResponseDto[]> {
    const reservas = await this.reservasService.buscarReservasPorPaciente(
      usuario.sub,
    );
    return reservas.map((reserva) =>
      HistorialReservaResponseDto.fromEntity(reserva),
    );
  }

  @Patch(':id/estado')
  @Auth(RolUsuario.MEDICO)
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

  @Post(':id/cancelacion')
  @HttpCode(HttpStatus.OK)
  @Auth(RolUsuario.PACIENTE)
  @ApiOperation({
    summary: 'Cancelar un turno propio antes del día de la consulta',
    description:
      'Permite al paciente cancelar una reserva propia en estado ACTIVO antes de las 00:00 del día del turno en hora local de America/Argentina/Buenos_Aires.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Identificador único de la reserva',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reserva cancelada exitosamente.',
    type: ReservaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Intento de cancelar el mismo día de la consulta o posterior a ella.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'El turno pertenece a otro paciente.',
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
  async cancelarReserva(
    @Param('id', ParseIntPipe) idReserva: number,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<ReservaResponseDto> {
    const reserva = await this.reservasService.cancelarReserva(
      idReserva,
      usuario.sub,
    );
    return ReservaResponseDto.fromEntity(reserva);
  }
}
