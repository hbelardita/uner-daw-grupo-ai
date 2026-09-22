import { describe, expect, it } from 'vitest';
import { envValidationSchema } from './env.validation.js';

describe('envValidationSchema', () => {
  it('should supply default values when given an empty environment object', () => {
    const { error, value } = envValidationSchema.validate(
      {},
      { abortEarly: false },
    );

    expect(error).toBeUndefined();
    expect(value).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: 5432,
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'tp-integrador',
      DB_LOGGING: false,
      CORS_ORIGIN: 'http://localhost:4200',
      SWAGGER_HABILITADO: true,
      JWT_SECRET: 'clave_secreta_jwt_para_desarrollo_y_tests',
      JWT_EXPIRES_IN: '8h',
    });
  });

  it('should accept valid explicit environment variables', () => {
    const input = {
      NODE_ENV: 'production',
      PORT: 8080,
      POSTGRES_HOST: 'db.example.com',
      POSTGRES_PORT: 5433,
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: 'secretpassword',
      POSTGRES_DB: 'clinic_prod',
      DB_LOGGING: true,
      CORS_ORIGIN: 'https://clinic.example.com',
      SWAGGER_HABILITADO: false,
      JWT_SECRET: 'custom_secret_key_with_at_least_16_chars',
      JWT_EXPIRES_IN: '2h',
    };

    const { error, value } = envValidationSchema.validate(input);

    expect(error).toBeUndefined();
    expect(value).toEqual(input);
  });

  it('should coerce valid string representations of numbers and booleans', () => {
    const input = {
      PORT: '4000',
      POSTGRES_PORT: '5432',
      DB_LOGGING: 'true',
    };

    const { error, value } = envValidationSchema.validate(input);

    expect(error).toBeUndefined();
    expect(value.PORT).toBe(4000);
    expect(value.POSTGRES_PORT).toBe(5432);
    expect(value.DB_LOGGING).toBe(true);
  });

  it('should reject invalid NODE_ENV values', () => {
    const { error } = envValidationSchema.validate({ NODE_ENV: 'invalid_env' });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toEqual(['NODE_ENV']);
  });

  it('should reject non-numeric or out-of-range PORT values', () => {
    const nonNumericResult = envValidationSchema.validate({ PORT: 'abc' });
    expect(nonNumericResult.error).toBeDefined();

    const outOfRangeResult = envValidationSchema.validate({ PORT: 70000 });
    expect(outOfRangeResult.error).toBeDefined();
  });

  it('should reject non-numeric or out-of-range POSTGRES_PORT values', () => {
    const nonNumericResult = envValidationSchema.validate({
      POSTGRES_PORT: 'invalid',
    });
    expect(nonNumericResult.error).toBeDefined();

    const outOfRangeResult = envValidationSchema.validate({
      POSTGRES_PORT: 99999,
    });
    expect(outOfRangeResult.error).toBeDefined();
  });

  it('should allow empty string for POSTGRES_PASSWORD', () => {
    const { error, value } = envValidationSchema.validate({
      POSTGRES_PASSWORD: '',
    });

    expect(error).toBeUndefined();
    expect(value.POSTGRES_PASSWORD).toBe('');
  });
});
