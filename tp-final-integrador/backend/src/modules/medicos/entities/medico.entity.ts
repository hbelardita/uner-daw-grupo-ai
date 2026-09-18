import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity('medicos')
export class Medico {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'id_usuario', type: 'int', unique: true })
  idUsuario: number;

  @Column({ type: 'int' })
  matricula: number;

  @Column({ name: 'valor_consulta', type: 'int' })
  valorConsulta: number;

  @OneToOne(() => Usuario, (usuario) => usuario.medico)
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario: Relation<Usuario>;
}
