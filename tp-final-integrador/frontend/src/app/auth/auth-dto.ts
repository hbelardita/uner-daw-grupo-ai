import { EstadoUsuario } from './estado-usuario';
import { RolUsuario } from './rol-usuario';

export interface LoginRequest {
  documento: string;
  clave: string;
}

export interface LoginResponse {
  token: string;
}

export interface MedicoProfile {
  id: number;
  matricula: number;
  valorConsulta: number;
}

export interface UserResponse {
  id: number;
  documento: string;
  apellidos: string;
  nombres: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  medico?: MedicoProfile;
}

export interface JwtPayload {
  sub: number;
  rol: RolUsuario;
  idMedico?: number;
  iat?: number;
  exp?: number;
}
