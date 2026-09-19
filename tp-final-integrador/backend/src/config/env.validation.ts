import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().default('postgres'),
  POSTGRES_PASSWORD: Joi.string().allow('').default('postgres'),
  POSTGRES_DB: Joi.string().default('tp-integrador'),
  DB_LOGGING: Joi.boolean().default(false),
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
  SWAGGER_HABILITADO: Joi.boolean().default(true),
  JWT_SECRET: Joi.string()
    .min(16)
    .default('clave_secreta_jwt_para_desarrollo_y_tests'),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
});
