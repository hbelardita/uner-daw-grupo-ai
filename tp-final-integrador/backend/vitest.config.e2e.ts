import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      root: './',
      include: ['**/*.e2e-spec.ts'],
      fileParallelism: false,
      hookTimeout: 30000,
      testTimeout: 30000,
      env: {
        NODE_ENV: 'test',
        POSTGRES_DB: env.POSTGRES_DB_TEST || 'tp-integrador-test',
        DB_LOGGING: 'false',
      },
    },
  };
});
