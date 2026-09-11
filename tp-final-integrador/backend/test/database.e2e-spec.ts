import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Base de datos (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Casos de éxito', () => {
    it('debe inicializar el DataSource y mantener una conexión activa', () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('debe ejecutar una consulta simple de verificación de conectividad', async () => {
      const result = await dataSource.query('SELECT 1 AS alive');
      expect(result).toEqual([{ alive: 1 }]);
    });

    it('debe verificar la existencia de las tablas del esquema inicial (usuarios y medicos)', async () => {
      const tables: Array<{ table_name: string }> = await dataSource.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN ('usuarios', 'medicos')
         ORDER BY table_name ASC`,
      );
      const tableNames = tables.map((row) => row.table_name);
      expect(tableNames).toContain('usuarios');
      expect(tableNames).toContain('medicos');
    });
  });

  describe('Errores esperados', () => {
    it('debe rechazar con error al ejecutar una sentencia SQL con sintaxis inválida', async () => {
      await expect(dataSource.query('SELECT FROM WHERE')).rejects.toThrow();
    });

    it('debe rechazar con error de relación no encontrada al consultar una tabla inexistente', async () => {
      await expect(
        dataSource.query('SELECT * FROM tabla_inexistente'),
      ).rejects.toThrow(/relation "tabla_inexistente" does not exist/);
    });
  });

  describe('Casos borde', () => {
    it('debe retornar un arreglo vacío al ejecutar una consulta parametrizada sin coincidencias', async () => {
      const result = await dataSource.query(
        'SELECT * FROM usuarios WHERE documento = $1',
        ['DOCUMENTO_INEXISTENTE_99999999'],
      );
      expect(result).toEqual([]);
    });
  });
});
