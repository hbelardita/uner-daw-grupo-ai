import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from '../reservas/entities/reserva.entity.js';
import { Medico } from './entities/medico.entity.js';
import { MedicosController } from './medicos.controller.js';
import { MedicosService } from './medicos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Medico, Reserva])],
  controllers: [MedicosController],
  providers: [MedicosService],
  exports: [TypeOrmModule],
})
export class MedicosModule {}
