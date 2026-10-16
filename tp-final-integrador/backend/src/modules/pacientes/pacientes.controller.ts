import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/index.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { BuscarPacientesQueryDto, PacienteResponseDto } from './dto/index.js';
import { PacientesService } from './pacientes.service.js';

@ApiTags('Pacientes')
@Controller('pacientes')
@ApiBearerAuth()
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  @Auth(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Buscar pacientes activos para autocompletar',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    examples: {
      'nombre o apellido': {
        value: 'Juan',
      },
      documento: {
        value: '10111111',
      },
    },
    description: 'Parte del nombre, apellido o documento del paciente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pacientes activos encontrados, como máximo 10.',
    type: [PacienteResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parámetro de búsqueda ausente o inválido.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso no permitido para el rol del usuario autenticado.',
  })
  async buscarPacientes(
    @Query() query: BuscarPacientesQueryDto,
  ): Promise<PacienteResponseDto[]> {
    const pacientes = await this.pacientesService.buscarPacientesActivos(
      query.busqueda,
    );

    return pacientes.map(PacienteResponseDto.fromEntity);
  }
}
