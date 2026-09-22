import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoUsuario, RolUsuario } from '../../usuarios/enums/index.js';

export class MedicoProfileDto {
  @ApiProperty({
    description: 'Identificador único del registro médico en base de datos',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número de matrícula profesional',
    example: 1001,
  })
  matricula: number;

  @ApiProperty({
    description: 'Valor de la consulta médica',
    example: 5000,
  })
  valorConsulta: number;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    description:
      'Identificador único del usuario autenticado (ID en base de datos)',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número de documento de identidad del usuario',
    example: '20111111',
  })
  documento: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Gomez',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Ana',
  })
  nombres: string;

  @ApiProperty({
    description: 'Correo electrónico institucional o personal del usuario',
    example: 'ana.gomez@clinica.test',
  })
  email: string;

  @ApiProperty({
    description: 'Rol del usuario en la plataforma',
    enum: RolUsuario,
    example: RolUsuario.MEDICO,
  })
  rol: RolUsuario;

  @ApiProperty({
    description: 'Estado actual de la cuenta de usuario',
    enum: EstadoUsuario,
    example: EstadoUsuario.ACTIVO,
  })
  estado: EstadoUsuario;

  @ApiPropertyOptional({
    description:
      'Datos del perfil médico (únicamente presente si el rol es MEDICO)',
    type: () => MedicoProfileDto,
  })
  medico?: MedicoProfileDto;
}
