import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import databaseConfig from './database.config.js';

describe('databaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Casos de éxito y valores por defecto', () => {
    it('debe retornar la configuración por defecto cuando las variables de entorno no están definidas', () => {
      delete process.env.POSTGRES_HOST;
      delete process.env.POSTGRES_PORT;
      delete process.env.POSTGRES_USER;
      delete process.env.POSTGRES_PASSWORD;
      delete process.env.POSTGRES_DB;
      delete process.env.DB_LOGGING;

      const config = databaseConfig();

      expect(config).toEqual({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'tp-integrador',
        logging: false,
      });
    });

    it('debe retornar los valores personalizados cuando las variables de entorno están definidas', () => {
      process.env.POSTGRES_HOST = 'db.internal';
      process.env.POSTGRES_PORT = '5433';
      process.env.POSTGRES_USER = 'custom_user';
      process.env.POSTGRES_PASSWORD = 'custom_password';
      process.env.POSTGRES_DB = 'custom_db';
      process.env.DB_LOGGING = 'true';

      const config = databaseConfig();

      expect(config).toEqual({
        type: 'postgres',
        host: 'db.internal',
        port: 5433,
        username: 'custom_user',
        password: 'custom_password',
        database: 'custom_db',
        logging: true,
      });
    });
  });

  describe('Casos borde y evaluación de DB_LOGGING', () => {
    it('debe evaluar logging como true cuando DB_LOGGING es exactamente "true"', () => {
      process.env.DB_LOGGING = 'true';

      const config = databaseConfig();

      expect(config.logging).toBe(true);
    });

    it.each([
      ['false', 'el valor es "false"'],
      ['invalid', 'el valor es una cadena arbitraria'],
      ['1', 'el valor es "1"'],
      ['0', 'el valor es "0"'],
      ['TRUE', 'el valor es en mayúsculas "TRUE"'],
      ['', 'el valor es una cadena vacía'],
      [' true ', 'el valor contiene espacios adicionales'],
    ])(
      'debe evaluar logging como false cuando DB_LOGGING="%s" (%s)',
      (dbLoggingValue) => {
        process.env.DB_LOGGING = dbLoggingValue;

        const config = databaseConfig();

        expect(config.logging).toBe(false);
      },
    );

    it('debe evaluar logging como false cuando DB_LOGGING es undefined', () => {
      delete process.env.DB_LOGGING;

      const config = databaseConfig();

      expect(config.logging).toBe(false);
    });
  });

  describe('Manejo y parseo del puerto (POSTGRES_PORT)', () => {
    it('debe parsear un puerto válido como número entero', () => {
      process.env.POSTGRES_PORT = '5435';

      const config = databaseConfig();

      expect(config.port).toBe(5435);
      expect(typeof config.port).toBe('number');
    });

    it('debe aplicar el puerto por defecto 5432 cuando POSTGRES_PORT es undefined', () => {
      delete process.env.POSTGRES_PORT;

      const config = databaseConfig();

      expect(config.port).toBe(5432);
    });
  });
});
