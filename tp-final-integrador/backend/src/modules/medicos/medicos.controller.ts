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
import { ReservaResponseDto } from './dto/reserva-response.dto.js';
import { MedicosService } from './medicos.service.js';

@ApiTags('Médicos')
@Controller('medicos')
@Auth(RolUsuario.MEDICO)
@ApiBearerAuth()
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}

  @Get(':idMedico/turnos')
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
