import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './entities/reserva.entity.js';
import { ReservasService } from './reservas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva])],
  providers: [ReservasService],
  exports: [TypeOrmModule, ReservasService],
})
export class ReservasModule {}
