import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './entities/reserva.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva])],
  exports: [TypeOrmModule],
})
export class ReservasModule {}
