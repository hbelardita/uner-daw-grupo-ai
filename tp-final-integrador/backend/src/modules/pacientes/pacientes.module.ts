import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { PacientesController } from './pacientes.controller.js';
import { PacientesService } from './pacientes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [PacientesController],
  providers: [PacientesService],
})
export class PacientesModule {}
