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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Auth, CurrentUser, type JwtPayload } from '../auth/index.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import {
  ActualizarEstadoReservaDto,
  ConsultarReservasAdminQueryDto,
  CrearReservaRequestDto,
  HistorialReservaResponseDto,
  ReservaAdminResponseDto,
  ReservaResponseDto,
  ReservasAdminPaginadasResponseDto,
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
  @Auth(RolUsuario.PACIENTE, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Crear un turno médico (paciente o administrador)',
    description:
      'Permite reservar un turno de lunes a viernes, de 08:00 a 15:00 en punto (hora local clínica), en el futuro y con un máximo de 30 días de anticipación. Un paciente se asigna a sí mismo desde el token; un administrador debe indicar el idPaciente del paciente destino en el cuerpo de la petición.',
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
    status: HttpStatus.NOT_FOUND,
    description:
      'El médico o el paciente indicado no existe o no se encuentra activo.',
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
        idPaciente: body.idPaciente,
        fechaHora: new Date(body.fechaHora),
        solicitante: { idUsuario: usuario.sub, rol: usuario.rol },
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
  @Auth(RolUsuario.PACIENTE, RolUsuario.ADMINISTRADOR)
  @ApiExtraModels(
    HistorialReservaResponseDto,
    ReservasAdminPaginadasResponseDto,
  )
  @ApiOperation({
    summary:
      'Consultar reservas (historial para paciente o supervisión global para administrador)',
    description:
      'Si el usuario autenticado tiene rol PACIENTE, devuelve su historial completo en orden cronológico descendente ignorando filtros externos. Si tiene rol ADMINISTRADOR, devuelve el listado global paginado en orden ascendente con soporte de filtros multicriterio.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Listado de reservas obtenido exitosamente (array para paciente, objeto paginado con meta para administrador).',
    schema: {
      oneOf: [
        {
          $ref: getSchemaPath(ReservasAdminPaginadasResponseDto),
        },
        {
          type: 'array',
          items: {
            $ref: getSchemaPath(HistorialReservaResponseDto),
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Parámetros de consulta inválidos (exclusivo para rol administrador).',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso no permitido para el rol del usuario autenticado.',
  })
  async listarReservas(
    @CurrentUser() usuario: JwtPayload,
    @Query() query: ConsultarReservasAdminQueryDto,
  ): Promise<
    HistorialReservaResponseDto[] | ReservasAdminPaginadasResponseDto
  > {
    if (usuario.rol === RolUsuario.PACIENTE) {
      const reservas = await this.reservasService.buscarReservasPorPaciente(
        usuario.sub,
      );
      return reservas.map((reserva) =>
        HistorialReservaResponseDto.fromEntity(reserva),
      );
    }

    const { data, meta } =
      await this.reservasService.listarReservasAdmin(query);
    return {
      data: data.map((reserva) => ReservaAdminResponseDto.fromEntity(reserva)),
      meta,
    };
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
