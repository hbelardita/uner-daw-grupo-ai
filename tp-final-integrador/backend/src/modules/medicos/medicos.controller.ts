import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { ConsultarAgendaQueryDto } from './dto/consultar-agenda-query.dto.js';
import { MedicoResponseDto } from './dto/medico-response.dto.js';
import { ReservaResponseDto } from './dto/reserva-response.dto.js';
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
  @ApiResponse({ status: HttpStatus.OK, type: [ReservaResponseDto] })
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
  ): Promise<ReservaResponseDto[]> {
    const reservas = await this.medicosService.buscarTurnosPorFecha(
      idMedico,
      usuario.idMedico,
      query.fecha,
    );

    return reservas.map(ReservaResponseDto.fromEntity);
  }
}
