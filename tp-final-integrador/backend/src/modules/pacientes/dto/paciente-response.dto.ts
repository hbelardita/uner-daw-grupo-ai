import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export class PacienteResponseDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: '30111111' })
  documento: string;

  @ApiProperty({ example: 'Julia' })
  nombres: string;

  @ApiProperty({ example: 'García' })
  apellidos: string;

  static fromEntity(usuario: Usuario): PacienteResponseDto {
    const dto = new PacienteResponseDto();
    dto.id = usuario.id;
    dto.documento = usuario.documento;
    dto.nombres = usuario.nombres;
    dto.apellidos = usuario.apellidos;
    return dto;
  }
}
