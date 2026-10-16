import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';

function escaparLike(termino: string): string {
  // Escapa backslash, porcentaje y guion bajo
  return termino.replace(/[%_\\]/g, '\\$&');
}

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async buscarPacientesActivos(busqueda?: string): Promise<Usuario[]> {
    const termino = busqueda?.trim();
    const base = {
      estado: EstadoUsuario.ACTIVO,
      rol: RolUsuario.PACIENTE,
    };
    const where = termino
      ? [
          { ...base, nombres: ILike(`%${escaparLike(termino)}%`) },
          { ...base, apellidos: ILike(`%${escaparLike(termino)}%`) },
          { ...base, documento: ILike(`%${escaparLike(termino)}%`) },
        ]
      : base;
    return this.usuariosRepository.find({
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
      },
      where,
      order: { apellidos: 'ASC', nombres: 'ASC' },
      take: 10,
    });
  }
}
