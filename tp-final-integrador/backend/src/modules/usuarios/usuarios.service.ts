import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  private buscarUno(
    where: FindOptionsWhere<Usuario>,
    incluirClave: boolean,
  ): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where,
      select: {
        id: true,
        documento: true,
        apellidos: true,
        nombres: true,
        email: true,
        ...(incluirClave ? { clave: true } : {}),
        estado: true,
        rol: true,
      },
      relations: {
        medico: true,
      },
    });
  }

  buscarPorDocumento(documento: string): Promise<Usuario | null> {
    return this.buscarUno({ documento }, true);
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.buscarUno({ id }, false);
  }
}
