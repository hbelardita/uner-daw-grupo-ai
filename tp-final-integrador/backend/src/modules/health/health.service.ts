import { Injectable } from '@nestjs/common';
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
  database: HealthDatabaseDetails;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly apiVersion = '1.0';

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthResponse> {
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

      const maxConnRaw = maxConnResult?.[0]?.max_connections;
      const parsedMaxConnections =
        maxConnRaw !== undefined && maxConnRaw !== null
          ? Number.parseInt(String(maxConnRaw), 10)
          : Number.NaN;
      const maxConnections = Number.isNaN(parsedMaxConnections)
        ? 0
        : parsedMaxConnections;

      const activeConnRaw = activeConnResult?.[0]?.count;
      const parsedActiveConnections =
        activeConnRaw !== undefined && activeConnRaw !== null
          ? Number.parseInt(String(activeConnRaw), 10)
          : Number.NaN;
      const activeConnections = Number.isNaN(parsedActiveConnections)
        ? 0
        : parsedActiveConnections;

      return {
        status: 'success',
        message: 'La API de DAW está funcionando correctamente',
        version: this.apiVersion,
        database: {
          status: 'connected',
          version,
          max_connections: maxConnections,
          active_connections: activeConnections,
        },
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      return {
        status: 'error',
        message: 'Error al verificar el estado de los servicios',
        version: this.apiVersion,
        database: {
          status: 'disconnected',
          error: errorMessage,
        },
        error: errorMessage,
      };
    }
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
