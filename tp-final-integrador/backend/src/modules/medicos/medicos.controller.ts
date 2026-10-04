import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard, RolesGuard } from '../auth/guards/index.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { Reserva } from '../reservas/entities/reserva.entity.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { MedicosService } from './medicos.service.js';

@ApiTags('Médicos')
@Controller('medicos')
@UseGuards(AuthGuard, RolesGuard)
@Roles(RolUsuario.MEDICO)
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
    description: 'Fecha de la agenda en formato AAAA-MM-DD.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [Reserva] })
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
    @Query('fecha') fecha: string,
    @CurrentUser() usuario: JwtPayload,
  ): Promise<Reserva[]> {
    return this.medicosService.buscarTurnosPorFecha(
      idMedico,
      usuario.idMedico,
      fecha,
    );
  }
}
