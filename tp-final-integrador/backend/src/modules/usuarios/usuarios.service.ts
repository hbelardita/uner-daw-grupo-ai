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
    opciones: { incluirClave?: boolean; incluirRelaciones?: boolean } = {},
  ): Promise<Usuario | null> {
    const { incluirClave = false, incluirRelaciones = false } = opciones;
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
      relations: incluirRelaciones ? { medico: true } : {},
    });
  }

  async buscarPorDocumento(documento: string): Promise<Usuario | null> {
    const documentoLimpio = documento.trim();
    if (!documentoLimpio) {
      return null;
    }
    return this.buscarUno(
      { documento: documentoLimpio },
      { incluirClave: true, incluirRelaciones: true },
    );
  }

  buscarPorId(
    id: number,
    opciones: { incluirRelaciones?: boolean } = {},
  ): Promise<Usuario | null> {
    return this.buscarUno({ id }, opciones);
  }
}
