import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medico } from './entities/medico.entity.js';
import { MedicosService } from './medicos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Medico])],
  providers: [MedicosService],
  exports: [TypeOrmModule, MedicosService],
})
export class MedicosModule {}
