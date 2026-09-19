import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';

export class CurrentUserResponseDto {
  @ApiProperty({
    description:
      'Identificador único del usuario autenticado (ID en base de datos)',
    example: 1,
  })
  sub: number;

  @ApiProperty({
    description: 'Rol del usuario en la plataforma',
    enum: RolUsuario,
    example: RolUsuario.MEDICO,
  })
  rol: RolUsuario;

  @ApiProperty({
    description: 'Correo electrónico institucional o personal del usuario',
    example: 'ana.gomez@clinica.test',
  })
  email: string;

  @ApiPropertyOptional({
    description:
      'Identificador de la entidad médico asociada (únicamente presente si el rol es MEDICO)',
    example: 1,
  })
  idMedico?: number;

  @ApiPropertyOptional({
    description: 'Timestamp de emisión del token JWT (issued at)',
    example: 1726750000,
  })
  iat?: number;

  @ApiPropertyOptional({
    description: 'Timestamp de expiración del token JWT',
    example: 1726753600,
  })
  exp?: number;
}
