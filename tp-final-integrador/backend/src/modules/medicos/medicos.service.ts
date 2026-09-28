import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException(
        'El parámetro fecha debe tener el formato AAAA-MM-DD.',
      );
    }

    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    if (
      Number.isNaN(inicio.getTime()) ||
      inicio.toISOString().slice(0, 10) !== fecha
    ) {
      throw new BadRequestException(
        'El parámetro fecha debe contener una fecha válida.',
      );
    }

    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 1);

    return this.reservasRepository.find({
      where: {
        idMedico,
        fechaHora: Between(inicio, fin),
        estado: Not(EstadoReserva.CANCELADO),
      },
      order: { fechaHora: 'ASC' },
    });
  }
}
