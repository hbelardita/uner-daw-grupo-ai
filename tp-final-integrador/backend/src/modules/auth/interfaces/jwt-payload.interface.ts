import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';

export interface JwtPayload {
  sub: number;
  rol: RolUsuario;
  idMedico?: number;
  iat?: number;
  exp?: number;
}
