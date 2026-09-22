import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medico } from './entities/medico.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Medico])],
  exports: [TypeOrmModule],
})
export class MedicosModule {}
