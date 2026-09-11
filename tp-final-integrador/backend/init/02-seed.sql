BEGIN;

-- ============================================================================
-- 1. POBLACIÓN DE USUARIOS (usuarios)
-- ============================================================================
-- Se insertan usuarios para todos los roles (MEDICO, PACIENTE, ADMINISTRADOR)
-- y estados (ACTIVO, BAJA).
-- Cada contraseña se encuentra hasheada con bcrypt (costo 10) para permitir
-- su posterior verificación mediante bcrypt.compare en el backend NestJS.
-- Se documenta la clave sin hashear en los comentarios para pruebas locales y E2E.
-- ============================================================================

-- ROL: MEDICO (3 ACTIVO, 1 BAJA)
-- Claves sin hashear:
--   - 20111111 (Ana Gomez):     clave_ficticia_1
--   - 20222222 (Luis Perez):    clave_ficticia_2
--   - 20333333 (Marina Diaz):   clave_ficticia_3
--   - 20444444 (Carlos Suarez): clave_ficticia_4
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol)
VALUES
    ('20111111', 'Gomez',   'Ana',    'ana.gomez@clinica.test',    '$2a$10$t.SXyTtffscH3KBbBSXXnOlHAdphAHq7CZNhWfQJGpTNKaWJwTzRu', 'ACTIVO', 'MEDICO'),
    ('20222222', 'Perez',   'Luis',   'luis.perez@clinica.test',   '$2a$10$SnOMPXnuqlPfVxSq8FPUXewNH2XlGTq4EsoQrT8Zo8gFaUfGM/zru', 'ACTIVO', 'MEDICO'),
    ('20333333', 'Diaz',    'Marina', 'marina.diaz@clinica.test',  '$2a$10$kPK7pCdeQBTwWoEkT3Y7nux6Ozj4nedgOb/quDKPTPap0cjFvcSvq', 'ACTIVO', 'MEDICO'),
    ('20444444', 'Suarez',  'Carlos', 'carlos.suarez@clinica.test','$2a$10$n5PrQDfV6gzOGMfnmn7vBe/bpbqsm6ks0okSEC5XaalBcyx5B.VDa', 'BAJA',   'MEDICO')
ON CONFLICT (documento) DO NOTHING;

-- ROL: PACIENTE (4 ACTIVO, 1 BAJA)
-- Claves sin hashear:
--   - 30111111 (Julia Fernandez): clave_ficticia_5
--   - 30222222 (Martin Lopez):    clave_ficticia_6
--   - 30333333 (Sofia Torres):    clave_ficticia_7
--   - 30444444 (Diego Ramirez):   clave_ficticia_8
--   - 30555555 (Paula Molina):    clave_ficticia_9
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol)
VALUES
    ('30111111', 'Fernandez', 'Julia',  'julia.fernandez@mail.test', '$2a$10$MthiOMsEFE8J2UwheVtsnuSIqoHWMjAmJD.0sjZ41Ugi7MSy7AaZK', 'ACTIVO', 'PACIENTE'),
    ('30222222', 'Lopez',     'Martin', 'martin.lopez@mail.test',    '$2a$10$liExhLZGvSMRzYuBfFfqkuC5q3Zw2aUGWP3z/DEiSX.PTtQ3fFiXS', 'ACTIVO', 'PACIENTE'),
    ('30333333', 'Torres',    'Sofia',  'sofia.torres@mail.test',    '$2a$10$9fasjzSmfsxYanQKSIevmu9ARHpD2R8XkjyNyyULeH1Hfb4VXEes.', 'ACTIVO', 'PACIENTE'),
    ('30444444', 'Ramirez',   'Diego',  'diego.ramirez@mail.test',   '$2a$10$2/fqWGc0DZMMHL2VXrLxreu8HV9MYymHDxOfhdKhnHbNxpgo8cfea', 'ACTIVO', 'PACIENTE'),
    ('30555555', 'Molina',    'Paula',  'paula.molina@mail.test',    '$2a$10$dXlX2PW9Jjkbo71tM7ZjIuyVh/vh9q4H.jufJGzIFCRjrQUlWYdqS', 'BAJA',   'PACIENTE')
ON CONFLICT (documento) DO NOTHING;

-- ROL: ADMINISTRADOR (1 ACTIVO, 1 BAJA)
-- Claves sin hashear:
--   - 40111111 (Valeria Acosta): clave_ficticia_10
--   - 40222222 (Mariano Romero): clave_ficticia_11
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol)
VALUES
    ('40111111', 'Acosta', 'Valeria', 'valeria.acosta@clinica.test', '$2a$10$X0ADtUZgBzQ/Hd6YXdlRd.0tdjEpmEzkGiBF1unqbTr58zgEjx3/C', 'ACTIVO', 'ADMINISTRADOR'),
    ('40222222', 'Romero', 'Mariano', 'mariano.romero@clinica.test', '$2a$10$y0MPHZS79VjiPth17L//iOuUDrUMI4aWMVC6pqn9uwGicsu4YSpY2', 'BAJA',   'ADMINISTRADOR')
ON CONFLICT (documento) DO NOTHING;

-- ============================================================================
-- 2. POBLACIÓN DE MÉDICOS (medicos)
-- ============================================================================
-- Se asocian perfiles de médico a cada usuario con rol MEDICO mediante búsqueda
-- dinámica por documento, garantizando independencia del valor de la secuencia SERIAL.
-- Se definen matrículas únicas y valores de consulta enteros (> 0).
-- ============================================================================
INSERT INTO medicos (id_usuario, matricula, valor_consulta)
SELECT u.id, v.matricula, v.valor_consulta
FROM (VALUES
    ('20111111', 1001, 5000),
    ('20222222', 1002, 4500),
    ('20333333', 1003, 5200),
    ('20444444', 1004, 4800)
) AS v(documento, matricula, valor_consulta)
JOIN usuarios u ON u.documento = v.documento
ON CONFLICT (id_usuario) DO NOTHING;

COMMIT;
