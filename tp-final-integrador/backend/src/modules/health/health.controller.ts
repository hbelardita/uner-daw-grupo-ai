import {
  Controller,
  Get,
  HttpStatus,
  Res,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthResponse, HealthService } from './health.service.js';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar el estado de salud de la API y la base de datos',
    description:
      'Comprueba la disponibilidad operativa de la API y la conectividad con PostgreSQL, reportando la versión del motor y métricas de conexiones activas y máximas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'La API y la base de datos se encuentran operativas.',
    schema: {
      example: {
        status: 'success',
        message: 'La API de DAW está funcionando correctamente',
        version: '0.0.1',
        timestamp: '2026-09-11T18:00:00.000Z',
        database: {
          status: 'connected',
          version: '16.15 (Debian 16.15-1.pgdg13+2)',
          max_connections: 100,
          active_connections: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description:
      'La base de datos no se encuentra disponible o falló la verificación.',
    schema: {
      example: {
        status: 'error',
        message: 'Error al verificar el estado de los servicios',
        version: '0.0.1',
        timestamp: '2026-09-11T18:00:00.000Z',
        database: {
          status: 'disconnected',
          error: 'Connection terminated unexpectedly',
        },
        error: 'Connection terminated unexpectedly',
      },
    },
  })
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResponse> {
    const result = await this.healthService.check();
    if (result.status === 'error') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
