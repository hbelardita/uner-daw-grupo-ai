import {
  Body,
  ConflictException,
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
  CrearReservaRequestDto,
  HistorialReservaResponseDto,
  ReservaResponseDto,
} from './dto/index.js';
import { ReservasService } from './reservas.service.js';

function esViolacionUnicidad(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const codigo = (error as { code?: unknown }).code;
  const codigoDriver = (error as { driverError?: { code?: unknown } })
    .driverError?.code;
  return codigo === '23505' || codigoDriver === '23505';
}

@ApiTags('Reservas')
@Controller('reservas')
@ApiBearerAuth()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(RolUsuario.PACIENTE)
  @ApiOperation({
    summary: 'Crear un turno médico (paciente)',
    description:
      'Permite al paciente autenticado reservar un turno de lunes a viernes, de 08:00 a 15:00 en punto (hora local clínica), en el futuro y con un máximo de 30 días de anticipación. El paciente se asigna desde el usuario autenticado.',
  })
  @ApiBody({ type: CrearReservaRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reserva creada exitosamente.',
    type: ReservaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Cuerpo de la petición inválido o incumplimiento de las reglas temporales de la reserva.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso no permitido para el rol del usuario autenticado.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El turno seleccionado ya se encuentra ocupado.',
  })
  async crearReserva(
    @Body() body: CrearReservaRequestDto,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<ReservaResponseDto> {
    try {
      const reserva = await this.reservasService.crearReserva({
        idMedico: body.idMedico,
        idPaciente: usuario.sub,
        fechaHora: new Date(body.fechaHora),
      });
      return ReservaResponseDto.fromEntity(reserva);
    } catch (error) {
      if (esViolacionUnicidad(error)) {
        throw new ConflictException(
          'El turno seleccionado ya se encuentra ocupado.',
        );
      }
      throw error;
    }
  }

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

  @Patch(':id')
  @Auth(RolUsuario.MEDICO)
  @ApiOperation({
    summary: 'Registrar la asistencia médica de un turno',
    description:
      'Permite al médico registrar la asistencia (ATENDIDO o AUSENTE) de un turno en estado ACTIVO una vez alcanzada la fecha y hora pactada.',
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
  @Auth(RolUsuario.PACIENTE, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cancelar un turno activo (paciente o administrador)',
    description:
      'Permite al paciente cancelar una reserva propia en estado ACTIVO antes de las 00:00 del día del turno (hora local de America/Argentina/Buenos_Aires), o al administrador cancelar cualquier turno activo hasta el instante previo a su inicio.',
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
      'Intento de cancelar el mismo día de la consulta (paciente) o una vez iniciada o transcurrida la consulta (administrador).',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'El turno pertenece a otro paciente (cuando el solicitante es paciente).',
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
    const reserva = await this.reservasService.cancelarReserva(idReserva, {
      idUsuario: usuario.sub,
      rol: usuario.rol,
    });
    return ReservaResponseDto.fromEntity(reserva);
  }
}
