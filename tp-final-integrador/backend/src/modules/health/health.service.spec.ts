import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let dataSourceMock: { query: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dataSourceMock = {
      query: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: getDataSourceToken(),
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('Casos de éxito', () => {
    it('debe retornar status success con métricas de base de datos cuando la conexión es exitosa', async () => {
      dataSourceMock.query.mockImplementation(async (sql: string) => {
        if (sql.includes('server_version')) {
          return [{ server_version: '16.15 (Debian 16.15-1.pgdg13+2)' }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: '100' }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: 6 }];
        }
        return [];
      });

      const result = await service.check();

      expect(result.status).toBe('success');
      expect(result.message).toBe(
        'La API de DAW está funcionando correctamente',
      );
      expect(result.version).toBe('1.0');
      expect(result.database).toEqual({
        status: 'connected',
        version: '16.15 (Debian 16.15-1.pgdg13+2)',
        max_connections: 100,
        active_connections: 6,
      });
    });

    it('debe ejecutar las consultas a la base de datos de forma paralela', async () => {
      let queryCount = 0;
      dataSourceMock.query.mockImplementation(async () => {
        queryCount++;
        return [{ server_version: '16.0', max_connections: '50', count: 2 }];
      });

      await service.check();

      expect(dataSourceMock.query).toHaveBeenCalledTimes(3);
      expect(queryCount).toBe(3);
    });

    it('debe parsear adecuadamente métricas de conexiones entregadas en formato string numérico', async () => {
      dataSourceMock.query.mockImplementation(async (sql: string) => {
        if (sql.includes('server_version')) {
          return [{ server_version: 'PostgreSQL 15.3' }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: '250' }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: '14' }];
        }
        return [];
      });

      const result = await service.check();

      expect(result.database.max_connections).toBe(250);
      expect(result.database.active_connections).toBe(14);
    });
  });

  describe('Errores esperados', () => {
    it('debe retornar status error y database disconnected cuando la base de datos arroja un Error', async () => {
      dataSourceMock.query.mockRejectedValue(
        new Error('Connection timeout to PostgreSQL'),
      );

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.message).toBe(
        'Error al verificar el estado de los servicios',
      );
      expect(result.version).toBe('1.0');
      expect(result.database.status).toBe('disconnected');
      expect(result.database.error).toBe('Connection timeout to PostgreSQL');
      expect(result.error).toBe('Connection timeout to PostgreSQL');
    });

    it('debe manejar excepciones no convencionales que no heredan de Error estándar', async () => {
      dataSourceMock.query.mockRejectedValue('Fatal socket closed by peer');

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.database.status).toBe('disconnected');
      expect(result.database.error).toBe('Fatal socket closed by peer');
      expect(result.error).toBe('Fatal socket closed by peer');
    });

    it('debe extraer los mensajes internos cuando la excepción es un AggregateError con mensaje vacío (típico de ECONNREFUSED en Node.js)', async () => {
      const aggregateError = new AggregateError(
        [
          new Error('connect ECONNREFUSED ::1:5432'),
          new Error('connect ECONNREFUSED 127.0.0.1:5432'),
        ],
        '',
      );

      dataSourceMock.query.mockRejectedValue(aggregateError);

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.database.status).toBe('disconnected');
      expect(result.database.error).toBe(
        'connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432',
      );
      expect(result.error).toBe(
        'connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432',
      );
    });
  });

  describe('Casos borde (edge cases)', () => {
    it('debe asignar valores por defecto seguros ante resultados vacíos de las consultas SQL', async () => {
      dataSourceMock.query.mockResolvedValue([]);

      const result = await service.check();

      expect(result.status).toBe('success');
      expect(result.database).toEqual({
        status: 'connected',
        version: 'unknown',
        max_connections: 0,
        active_connections: 0,
      });
    });

    it('debe manejar métricas corruptas o no numéricas (NaN) asignando 0 de forma segura', async () => {
      dataSourceMock.query.mockImplementation(async (sql: string) => {
        if (sql.includes('server_version')) {
          return [{ server_version: '16.0' }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: 'not-a-number' }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: 'invalid' }];
        }
        return [];
      });

      const result = await service.check();

      expect(result.database.max_connections).toBe(0);
      expect(result.database.active_connections).toBe(0);
    });

    it('debe manejar registros con valores nulos o indefinidos en las propiedades', async () => {
      dataSourceMock.query.mockImplementation(async (sql: string) => {
        if (sql.includes('server_version')) {
          return [{ server_version: null }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: null }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: undefined }];
        }
        return [];
      });

      const result = await service.check();

      expect(result.database.version).toBe('unknown');
      expect(result.database.max_connections).toBe(0);
      expect(result.database.active_connections).toBe(0);
    });

    it('debe exponer la versión de la API configurada en 1.0', () => {
      expect(service['apiVersion']).toBe('1.0');
    });
  });
});
