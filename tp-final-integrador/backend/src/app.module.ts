import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { MedicosModule } from './modules/medicos/medicos.module.js';
import { ReservasModule } from './modules/reservas/reservas.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      } as Record<string, unknown>,
    }),
    DatabaseModule,
    HealthModule,
    UsuariosModule,
    MedicosModule,
    ReservasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
