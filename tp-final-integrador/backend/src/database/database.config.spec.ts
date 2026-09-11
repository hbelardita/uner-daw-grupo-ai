import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  it('should return default values when environment variables are not set', () => {
    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_DB;

    const config = databaseConfig();

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'tp-integrador',
    });
  });

  it('should return custom values when environment variables are set', () => {
    process.env.POSTGRES_HOST = 'db.internal';
    process.env.POSTGRES_PORT = '5433';
    process.env.POSTGRES_USER = 'custom_user';
    process.env.POSTGRES_PASSWORD = 'custom_password';
    process.env.POSTGRES_DB = 'custom_db';

    const config = databaseConfig();

    expect(config).toEqual({
      type: 'postgres',
      host: 'db.internal',
      port: 5433,
      username: 'custom_user',
      password: 'custom_password',
      database: 'custom_db',
    });
  });
});
