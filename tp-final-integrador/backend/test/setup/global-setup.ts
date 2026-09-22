import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from 'pg';

const currentDirPath = path.dirname(fileURLToPath(import.meta.url));

export async function setup(): Promise<void> {
  const envPath = path.resolve(currentDirPath, '../../.env');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch {}
  }

  const connectionConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  };
  const testDb = process.env.POSTGRES_DB_TEST || 'tp-integrador-test';

  const initSqlPath = path.resolve(currentDirPath, '../../init/01-init.sql');
  const seedSqlPath = path.resolve(currentDirPath, '../../init/02-seed.sql');

  if (!fs.existsSync(initSqlPath) || !fs.existsSync(seedSqlPath)) {
    throw new Error(
      `Database initialization files not found. Looked for ${initSqlPath} and ${seedSqlPath}`,
    );
  }

  const initSql = fs.readFileSync(initSqlPath, 'utf8');
  const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

  // Paso 1: asegurar que existe la base de tests
  const adminClient = new Client({
    ...connectionConfig,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const checkDbRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [testDb],
    );

    if (checkDbRes.rowCount === 0) {
      const quotedDb = testDb.replace(/"/g, '""');
      await adminClient.query(`CREATE DATABASE "${quotedDb}"`);
    }
  } finally {
    await adminClient.end().catch(() => {});
  }

  // Paso 2: conectar a la base de pruebas, asegurar esquema, truncar y sembrar datos
  const testClient = new Client({
    ...connectionConfig,
    database: testDb,
  });

  try {
    await testClient.connect();

    // Asegurar que el esquema esté actualizado (crea tipos y tablas si no existen)
    await testClient.query(initSql);

    // Truncar datos existentes y reiniciar secuencias de identidad
    await testClient.query(
      'TRUNCATE TABLE reservas, medicos, usuarios RESTART IDENTITY CASCADE;',
    );

    // Poblar datos iniciales (seed)
    await testClient.query(seedSql);
  } finally {
    await testClient.end().catch(() => {});
  }
}

export default setup;

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message) {
      return err.message;
    }
    if ('errors' in err && Array.isArray(err.errors) && err.errors.length > 0) {
      return err.errors
        .map((e) => (e instanceof Error ? e.message : String(e)))
        .join('; ');
    }
    return err.stack || err.name;
  }
  return String(err);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  setup()
    .then(() => {
      process.stdout.write(
        '✓ Base de datos de pruebas reiniciada y poblada con éxito.\n',
      );
      process.exit(0);
    })
    .catch((err: unknown) => {
      process.stderr.write(
        `Error al reiniciar la base de datos de pruebas: ${formatErrorMessage(err)}\n`,
      );
      process.exit(1);
    });
}
