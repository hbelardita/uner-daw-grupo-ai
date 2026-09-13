import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.POSTGRES_HOST ?? 'localhost',
  // Accept both raw string values and Joi-coerced values (convert:true runs before this factory).
  // Empty string is treated as invalid (NaN) so a misconfigured port fails loudly instead of silently becoming 0.
  port:
    process.env.POSTGRES_PORT === ''
      ? NaN
      : Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'tp-integrador',
  // Query logging is forced off in production to avoid leaking queries and
  // bound parameters (PII) into log aggregators. In other environments it is
  // opt-in via DB_LOGGING. Accept both raw string values and Joi-coerced values.
  logging:
    process.env.NODE_ENV === 'production'
      ? false
      : (process.env.DB_LOGGING as unknown as string | boolean) === true ||
        (process.env.DB_LOGGING as unknown as string | boolean) === 'true',
}));
