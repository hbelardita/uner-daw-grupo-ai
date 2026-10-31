module.exports = {
  apps: [
    {
      name: 'tp-final-integrador-api',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      restart_delay: 5000,
      kill_timeout: 5000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'tp-integrador',
        POSTGRES_DB_TEST: 'tp-integrador-test',
        DB_LOGGING: false,
        SWAGGER_HABILITADO: false,
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost',
      },
    },
  ],
};
