import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity.js';
import { EstadoReserva } from '../reservas/enums/estado-reserva.enum.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { Medico } from './entities/medico.entity.js';

@Injectable()
export class MedicosService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    @InjectRepository(Medico)
    private readonly medicosRepository: Repository<Medico>,
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

  async buscarMedicosHabilitados(): Promise<Medico[]> {
    return this.medicosRepository.find({
      relations: { usuario: true },
      where: {
        usuario: {
          estado: EstadoUsuario.ACTIVO,
        },
      },
      order: {
        usuario: {
          apellidos: 'ASC',
          nombres: 'ASC',
        },
      },
    });
  }

  async actualizarValorConsulta(
    idMedico: number,
    nuevoValorConsulta: number,
  ): Promise<Medico> {
    const medico = await this.medicosRepository.findOne({
      where: { id: idMedico },
      relations: { usuario: true },
    });

    if (!medico) {
      throw new NotFoundException(
        `No se encontró el médico con id ${idMedico}.`,
      );
    }

    medico.valorConsulta = nuevoValorConsulta;
    return this.medicosRepository.save(medico);
  }
}
