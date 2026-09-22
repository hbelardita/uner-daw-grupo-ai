import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsNotEmpty()
  clave: string;
}
