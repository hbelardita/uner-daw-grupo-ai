import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import {
  DIAS_MAXIMOS_ANTELACION,
  diferenciaDiasCalendario,
  esFinDeSemana,
  generarSlotsDelDia,
  obtenerPartesLocales,
  parsearYValidarFechaCalendario,
} from '../reservas/domain/reglas-temporales.js';
import { Reserva } from '../reservas/entities/reserva.entity.js';
import { EstadoReserva } from '../reservas/enums/estado-reserva.enum.js';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import { Medico } from './entities/medico.entity.js';

export interface SlotDisponibilidad {
  fechaHora: string;
  disponible: boolean;
}

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

  async obtenerDisponibilidad(
    idMedico: number,
    fecha: string,
    ahora: Date = new Date(),
  ): Promise<SlotDisponibilidad[]> {
    const medico = await this.medicosRepository.findOne({
      where: {
        id: idMedico,
        usuario: { estado: EstadoUsuario.ACTIVO },
      },
      relations: { usuario: true },
      select: { id: true },
    });

    if (!medico) {
      throw new NotFoundException(
        `No se encontró el médico con id ${idMedico}.`,
      );
    }

    const partesFecha = parsearYValidarFechaCalendario(fecha);

    const partesAhora = obtenerPartesLocales(ahora);
    const diasDeAntelacion = diferenciaDiasCalendario(partesAhora, partesFecha);

    const bloqueadoPorCalendario =
      esFinDeSemana(partesFecha) ||
      diasDeAntelacion < 0 ||
      diasDeAntelacion > DIAS_MAXIMOS_ANTELACION;

    const slots = generarSlotsDelDia(fecha);
    if (bloqueadoPorCalendario) {
      return slots.map((slot) => ({
        fechaHora: slot.toISOString(),
        disponible: false,
      }));
    }

    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 1);

    const reservas = await this.reservasRepository.find({
      where: {
        idMedico,
        fechaHora: And(MoreThanOrEqual(inicio), LessThan(fin)),
        estado: Not(EstadoReserva.CANCELADO),
      },
      select: { fechaHora: true },
    });
    const ocupados = new Set(
      reservas.map((reserva) =>
        reserva.fechaHora instanceof Date
          ? reserva.fechaHora.getTime()
          : new Date(reserva.fechaHora).getTime(),
      ),
    );
    const ahoraMs = ahora.getTime();
    return slots.map((slot) => ({
      fechaHora: slot.toISOString(),
      disponible: slot.getTime() > ahoraMs && !ocupados.has(slot.getTime()),
    }));
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
