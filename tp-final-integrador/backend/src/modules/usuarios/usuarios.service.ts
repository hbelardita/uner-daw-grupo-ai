import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  buscarPorDocumento(documento: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: { documento },
      select: {
        id: true,
        documento: true,
        apellidos: true,
        nombres: true,
        email: true,
        clave: true,
        estado: true,
        rol: true,
      },
      relations: {
        medico: true,
      },
    });
  }
}
