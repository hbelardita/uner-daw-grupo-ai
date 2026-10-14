import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, CurrentUser, type JwtPayload } from '../auth/index.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import {
  ActualizarValorConsultaDto,
  ConsultarAgendaQueryDto,
  DisponibilidadSlotResponseDto,
  MedicoResponseDto,
  TurnoMedicoResponseDto,
} from './dto/index.js';
import { MedicosService } from './medicos.service.js';

@ApiTags('Médicos')
@Controller('medicos')
@ApiBearerAuth()
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}

  @Get()
  @Auth(RolUsuario.PACIENTE, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar el listado de profesionales habilitados',
    description:
      'Devuelve el listado de médicos cuyo usuario asociado se encuentra en estado ACTIVO, con matrículas y honorarios vigentes, ordenados alfabéticamente por apellido y nombre.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de médicos obtenido exitosamente.',
    type: [MedicoResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso no permitido para el rol del usuario autenticado.',
  })
  async obtenerMedicosHabilitados(): Promise<MedicoResponseDto[]> {
    const medicos = await this.medicosService.buscarMedicosHabilitados();
    return medicos.map(MedicoResponseDto.fromEntity);
  }

  @Get(':idMedico/turnos')
  @Auth(RolUsuario.MEDICO)
  @ApiOperation({
    summary: 'Consultar la agenda propia de un médico por fecha',
  })
  @ApiParam({ name: 'idMedico', type: Number, example: 1 })
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    example: '2026-09-26',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [TurnoMedicoResponseDto] })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'El médico intenta consultar la agenda de otro profesional.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La fecha no tiene el formato o valor esperado.',
  })
  async obtenerTurnos(
    @Param('idMedico', ParseIntPipe) idMedico: number,
    @Query() query: ConsultarAgendaQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<TurnoMedicoResponseDto[]> {
    const reservas = await this.medicosService.buscarTurnosPorFecha(
      idMedico,
      usuario.idMedico,
      query.fecha,
    );

    return reservas.map(TurnoMedicoResponseDto.fromEntity);
  }

  @Get(':id/disponibilidad')
  @Auth(RolUsuario.PACIENTE, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar la grilla de disponibilidad de un médico por fecha',
    description:
      'Devuelve los 8 slots de las horas en punto entre las 08:00 y las 15:00 (hora local America/Argentina/Buenos_Aires) indicando si cada horario está libre u ocupado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Identificador único del médico',
  })
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    example: '2026-10-15',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grilla de disponibilidad obtenida exitosamente.',
    type: [DisponibilidadSlotResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parámetro de ruta o fecha con formato inválido.',
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
    description: 'No se encontró el médico con el id especificado.',
  })
  async obtenerDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConsultarAgendaQueryDto,
  ): Promise<DisponibilidadSlotResponseDto[]> {
    return this.medicosService.obtenerDisponibilidad(id, query.fecha);
  }

  @Patch(':id/valor-consulta')
  @Auth(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar honorario de consulta de un médico',
    description:
      'Permite al Administrador actualizar el valor de consulta vigente de un médico.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Identificador único del médico',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Honorario de consulta actualizado exitosamente.',
    type: MedicoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parámetro de ruta o cuerpo de la solicitud inválido.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado (requiere rol ADMINISTRADOR).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No se encontró el médico con el id especificado.',
  })
  async actualizarValorConsulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarValorConsultaDto,
  ): Promise<MedicoResponseDto> {
    const medico = await this.medicosService.actualizarValorConsulta(
      id,
      dto.valorConsulta,
    );
    return MedicoResponseDto.fromEntity(medico);
  }
}
