import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Documento nacional de identidad del usuario',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  documento: string;

  @ApiProperty({
    description: 'Clave o contraseña de acceso del usuario',
    example: 'passwordSeguro123',
  })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
