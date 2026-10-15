import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicosModule } from '../medicos/medicos.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { Reserva } from './entities/reserva.entity.js';
import { ReservasController } from './reservas.controller.js';
import { ReservasService } from './reservas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva]), MedicosModule, UsuariosModule],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [TypeOrmModule, ReservasService],
})
export class ReservasModule {}
