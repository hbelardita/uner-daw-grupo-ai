import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthDatabaseDetails {
  status: 'connected' | 'disconnected';
  version?: string;
  max_connections?: number;
  active_connections?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'success' | 'error';
  message: string;
  version: string;
  timestamp: string;
  database: HealthDatabaseDetails;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly apiVersion = '1.0';

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();
    try {
      const [versionResult, maxConnResult, activeConnResult] =
        await Promise.all([
          this.dataSource.query('SHOW server_version;'),
          this.dataSource.query('SHOW max_connections;'),
          this.dataSource.query(
            'SELECT count(*)::int as count FROM pg_stat_activity;',
          ),
        ]);

      const version = versionResult?.[0]?.server_version ?? 'unknown';
      const maxConnections = this.parseConnectionMetric(
        maxConnResult?.[0]?.max_connections,
      );
      const activeConnections = this.parseConnectionMetric(
        activeConnResult?.[0]?.count,
      );

      return {
        status: 'success',
        message: 'La API de DAW está funcionando correctamente',
        version: this.apiVersion,
        timestamp,
        database: {
          status: 'connected',
          version,
          max_connections: maxConnections,
          active_connections: activeConnections,
        },
      };
    } catch (error) {
      const detailedError = this.extractErrorMessage(error);
      this.logger.error(
        `Fallo en la verificación de base de datos: ${detailedError}`,
        error instanceof Error ? error.stack : undefined,
      );

      const clientErrorMessage =
        'No se pudo establecer conexión con la base de datos';

      return {
        status: 'error',
        message: 'Error al verificar el estado de los servicios',
        version: this.apiVersion,
        timestamp,
        database: {
          status: 'disconnected',
          error: clientErrorMessage,
        },
      };
    }
  }

  protected parseConnectionMetric(raw: unknown): number {
    if (raw === undefined || raw === null) {
      return 0;
    }
    const parsed = Number.parseInt(String(raw), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  protected extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message && error.message.trim().length > 0) {
        return error.message;
      }
      if (
        'errors' in error &&
        Array.isArray((error as AggregateError).errors) &&
        (error as AggregateError).errors.length > 0
      ) {
        return (error as AggregateError).errors
          .map((subError: unknown) =>
            subError instanceof Error ? subError.message : String(subError),
          )
          .join('; ');
      }
      if ('code' in error && error.code) {
        return String(error.code);
      }
      return error.name || 'Error de conexión';
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    return 'Error desconocido de base de datos';
  }
}
