import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity.js';
import { EstadoReserva } from '../reservas/enums/estado-reserva.enum.js';

@Injectable()
export class MedicosService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
  ) {}

  async buscarTurnosPorFecha(
    idMedico: number,
    idMedicoAutenticado: number | undefined,
    fecha: string,
  ): Promise<Reserva[]> {
    if (idMedico !== idMedicoAutenticado) {
      throw new ForbiddenException(
        'Solo puede consultar la agenda del médico autenticado.',
      );
    }

    const inicio = new Date(`${fecha}T00:00:00.000Z`);

    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 1);

    return this.reservasRepository.find({
      where: {
        idMedico,
        fechaHora: And(MoreThanOrEqual(inicio), LessThan(fin)),
        estado: Not(EstadoReserva.CANCELADO),
      },
      relations: { paciente: true },
      order: { fechaHora: 'ASC' },
    });
  }
}
