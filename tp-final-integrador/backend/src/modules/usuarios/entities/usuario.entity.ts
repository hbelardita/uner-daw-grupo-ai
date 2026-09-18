import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { EstadoUsuario, RolUsuario } from '../enums/index.js';
import { Medico } from '../../medicos/entities/medico.entity.js';
import { Reserva } from '../../reservas/entities/reserva.entity.js';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  documento: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  clave: string;

  @Column({
    type: 'enum',
    enum: EstadoUsuario,
    enumName: 'estados_usuarios',
    default: EstadoUsuario.ACTIVO,
  })
  estado: EstadoUsuario;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    enumName: 'roles_usuarios',
  })
  rol: RolUsuario;

  @OneToOne(() => Medico, (medico) => medico.usuario)
  medico?: Relation<Medico>;

  @OneToMany(() => Reserva, (reserva) => reserva.paciente)
  reservas?: Relation<Reserva[]>;
}
