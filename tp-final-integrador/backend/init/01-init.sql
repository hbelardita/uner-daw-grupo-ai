BEGIN;



DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estados_usuarios') THEN
        CREATE TYPE estados_usuarios AS ENUM ('ACTIVO', 'BAJA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roles_usuarios') THEN
        CREATE TYPE roles_usuarios AS ENUM ('MEDICO', 'PACIENTE', 'ADMINISTRADOR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estados_reservas') THEN
        CREATE TYPE estados_reservas AS ENUM ('ACTIVO', 'ATENDIDO', 'AUSENTE', 'CANCELADO');
    END IF;
END $$;



-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    documento VARCHAR(20) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    clave VARCHAR(255) NOT NULL,
    estado estados_usuarios NOT NULL DEFAULT 'ACTIVO',
    rol roles_usuarios NOT NULL,
    CONSTRAINT uq_usuarios_documento UNIQUE (documento)
);

-- Tabla: medicos
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    matricula INTEGER NOT NULL,
    valor_consulta INTEGER NOT NULL,
    CONSTRAINT uq_medicos_id_usuario UNIQUE (id_usuario),
    CONSTRAINT chk_medicos_valor_consulta CHECK (valor_consulta > 0),
    CONSTRAINT fk_medicos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Tabla: reservas
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    id_medico INTEGER NOT NULL,
    id_paciente INTEGER NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    estado estados_reservas NOT NULL DEFAULT 'ACTIVO',
    valor_consulta INTEGER NOT NULL,
    CONSTRAINT chk_reservas_valor_consulta CHECK (valor_consulta > 0),
    CONSTRAINT fk_reservas_medico FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reservas_paciente FOREIGN KEY (id_paciente) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_reservas_horario_atencion
    CHECK (
        "fecha_hora"::time IN (
            '08:00:00', '09:00:00', '10:00:00', '11:00:00',
            '12:00:00', '13:00:00', '14:00:00', '15:00:00'
        )
    )
);




CREATE UNIQUE INDEX IF NOT EXISTS uq_reservas_medico_horario_activo
    ON reservas (id_medico, fecha_hora)
    WHERE estado != 'CANCELADO';

CREATE INDEX IF NOT EXISTS idx_reservas_medico_fecha
    ON reservas (id_medico, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_reservas_paciente
    ON reservas (id_paciente);

COMMIT;
