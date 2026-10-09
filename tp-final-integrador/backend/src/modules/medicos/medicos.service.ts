import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medico } from './entities/medico.entity.js';

@Injectable()
export class MedicosService {
  constructor(
    @InjectRepository(Medico)
    private readonly medicosRepository: Repository<Medico>,
  ) {}

  async obtenerArancelVigente(idMedico: number): Promise<number> {
    const medico = await this.medicosRepository.findOne({
      where: { id: idMedico },
      select: { id: true, valorConsulta: true },
    });

    if (!medico) {
      throw new NotFoundException(
        `No se encontró el médico con id ${idMedico}.`,
      );
    }

    return medico.valorConsulta;
  }
}
