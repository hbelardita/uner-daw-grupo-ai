import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/index.js';
import {
  CurrentUserResponseDto,
  LoginRequestDto,
  LoginResponseDto,
} from './dto/index.js';
import { AuthGuard } from './guards/index.js';
import type { JwtPayload } from './interfaces/index.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión con documento y clave',
    description:
      'Autentica un usuario activo (médico, paciente o administrador) y emite un token de sesión.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autenticación exitosa. Retorna el token de sesión.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada incompletos o con formato inválido.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Documento inexistente, clave incorrecta o usuario dado de baja.',
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado actual',
    description:
      'Retorna el payload del token JWT verificado para el usuario en sesión activa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del usuario autenticado obtenida con éxito.',
    type: CurrentUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de sesión no proporcionado, inválido o expirado.',
  })
  async me(@CurrentUser() usuario: JwtPayload): Promise<JwtPayload> {
    return usuario;
  }
}
