import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Documento nacional de identidad del usuario',
    example: '20111111',
  })
  @IsString()
  @IsNotEmpty()
  documento: string;

  @ApiProperty({
    description: 'Clave o contraseña de acceso del usuario',
    example: 'clave_ficticia_1',
  })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
