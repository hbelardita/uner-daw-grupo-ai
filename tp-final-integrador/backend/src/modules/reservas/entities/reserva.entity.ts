import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  type Relation,
} from 'typeorm';
import { EstadoReserva } from '../enums/index.js';
import { Medico } from '../../medicos/entities/medico.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity('reservas')
@Index('uq_reservas_medico_horario_activo', ['idMedico', 'fechaHora'], {
  unique: true,
  where: "estado != 'CANCELADO'",
})
@Index('idx_reservas_medico_fecha', ['idMedico', 'fechaHora'])
@Index('idx_reservas_paciente', ['idPaciente'])
export class Reserva {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'id_medico', type: 'int' })
  idMedico: number;

  @Column({ name: 'id_paciente', type: 'int' })
  idPaciente: number;

  @Column({ name: 'fecha_hora', type: 'timestamp' })
  fechaHora: Date;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    enumName: 'estados_reservas',
    default: EstadoReserva.ACTIVO,
  })
  estado: EstadoReserva;

  @Column({ name: 'valor_consulta', type: 'int' })
  valorConsulta: number;

  @ManyToOne(() => Medico, (medico) => medico.reservas)
  @JoinColumn({ name: 'id_medico', referencedColumnName: 'id' })
  medico: Relation<Medico>;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas)
  @JoinColumn({ name: 'id_paciente', referencedColumnName: 'id' })
  paciente: Relation<Usuario>;
}
