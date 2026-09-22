import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginRequestDto, LoginResponseDto } from './dto/index.js';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService) {}

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const errorCredencialesInvalidas = new UnauthorizedException(
      'Documento o clave incorrectos.',
    );

    const usuario = await this.usuariosService.buscarPorDocumento(
      dto.documento,
    );
    if (!usuario) {
      throw errorCredencialesInvalidas;
    }

    if (usuario.estado !== EstadoUsuario.ACTIVO) {
      throw errorCredencialesInvalidas;
    }

    const esClaveValida = await bcrypt.compare(dto.clave, usuario.clave);
    if (!esClaveValida) {
      throw errorCredencialesInvalidas;
    }

    // Generación de token provisional luego firmado formal con @nestjs/jwt
    const payload = {
      sub: usuario.id,
      nombre: usuario.nombres,
    };
    const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return { token };
  }
}
