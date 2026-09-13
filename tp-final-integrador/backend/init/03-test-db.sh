#!/bin/bash
set -e

TEST_DB="${POSTGRES_DB_TEST:-tp-integrador-test}"

echo "Inicializando base de datos de pruebas ($TEST_DB)..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "' || '$TEST_DB' || '"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$TEST_DB')\gexec
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$TEST_DB" -f /docker-entrypoint-initdb.d/01-init.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$TEST_DB" -f /docker-entrypoint-initdb.d/02-seed.sql

echo "Base de datos de pruebas ($TEST_DB) inicializada correctamente."
