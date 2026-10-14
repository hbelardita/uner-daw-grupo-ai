import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async buscarPacientesActivos(busqueda: string): Promise<Usuario[]> {
    const termino = `%${busqueda.trim()}%`;

    return this.usuariosRepository.find({
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
      },
      where: [
        {
          estado: EstadoUsuario.ACTIVO,
          rol: RolUsuario.PACIENTE,
          nombres: ILike(termino),
        },
        {
          estado: EstadoUsuario.ACTIVO,
          rol: RolUsuario.PACIENTE,
          apellidos: ILike(termino),
        },
        {
          estado: EstadoUsuario.ACTIVO,
          rol: RolUsuario.PACIENTE,
          documento: ILike(termino),
        },
      ],
      order: { apellidos: 'ASC', nombres: 'ASC' },
      take: 10,
    });
  }
}
