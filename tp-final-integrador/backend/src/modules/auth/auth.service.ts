import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import {
  CurrentUserResponseDto,
  LoginRequestDto,
  LoginResponseDto,
} from './dto/index.js';
import { JwtPayload } from './interfaces/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

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

    const payload: JwtPayload = {
      sub: usuario.id,
      rol: usuario.rol,
      email: usuario.email,
      ...(usuario.rol === RolUsuario.MEDICO && usuario.medico?.id
        ? { idMedico: usuario.medico.id }
        : {}),
    };

    const token = await this.jwtService.signAsync(payload);

    return { token };
  }

  async obtenerPerfil(idUsuario: number): Promise<CurrentUserResponseDto> {
    const usuario = await this.usuariosService.buscarPorId(idUsuario);

    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Usuario no encontrado o dado de baja.');
    }

    const respuesta: CurrentUserResponseDto = {
      id: usuario.id,
      documento: usuario.documento,
      apellidos: usuario.apellidos,
      nombres: usuario.nombres,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };

    if (usuario.rol === RolUsuario.MEDICO && usuario.medico) {
      respuesta.medico = {
        id: usuario.medico.id,
        matricula: usuario.medico.matricula,
        valorConsulta: usuario.medico.valorConsulta,
      };
    }

    return respuesta;
  }

  async verificarToken(token: string | undefined): Promise<JwtPayload> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Token de sesión no proporcionado.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload.sub || !payload.rol || !payload.email) {
        throw new UnauthorizedException(
          'Token de sesión con claims requeridos ausentes.',
        );
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token de sesión inválido o expirado.');
    }
  }
}
