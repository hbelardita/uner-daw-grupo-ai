import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { EstadoUsuario } from '../usuarios/enums/estado-usuario.enum.js';
import type { Medico } from './entities/medico.entity.js';
import { MedicosService } from './medicos.service.js';

const VALOR_VIGENTE = 15000;

function crearMedico(
  estado: EstadoUsuario,
  valorConsulta: number = VALOR_VIGENTE,
): Medico {
  return {
    id: 7,
    idUsuario: 3,
    matricula: 98765,
    valorConsulta,
    usuario: {
      id: 3,
      estado,
      apellidos: 'Gómez',
      nombres: 'Ana',
    },
  } as Medico;
}

/**
 * Instancia el servicio con un repositorio de médicos falso que devuelve
 * `medico` en toda búsqueda por id y registra las escrituras realizadas.
 * Respeta el filtro por estado del usuario, igual que la consulta real.
 */
function crearServicio(medico: Medico | null) {
  const guardados: Medico[] = [];
  const medicosRepository = {
    findOne: async (opciones: {
      where?: { usuario?: { estado?: EstadoUsuario } };
    }) => {
      if (!medico) {
        return null;
      }

      const estadoRequerido = opciones.where?.usuario?.estado;
      if (estadoRequerido && medico.usuario.estado !== estadoRequerido) {
        return null;
      }

      return medico;
    },
    save: async (entidad: Medico) => {
      guardados.push(entidad);
      return entidad;
    },
  };

  return {
    servicio: new MedicosService(
      undefined as never,
      medicosRepository as never,
    ),
    guardados,
  };
}

describe('MedicosService - Actualizar valor de consulta', () => {
  describe('Casos de éxito', () => {
    it('debe actualizar el valor de consulta de un médico activo', async () => {
      const { servicio, guardados } = crearServicio(
        crearMedico(EstadoUsuario.ACTIVO),
      );

      const actualizado = await servicio.actualizarValorConsulta(7, 20000);

      expect(actualizado.valorConsulta).toBe(20000);
      expect(guardados).toHaveLength(1);
      expect(guardados[0].valorConsulta).toBe(20000);
    });
  });

  describe('Errores esperados', () => {
    it('debe rechazar con ConflictException si el médico está dado de baja', async () => {
      const { servicio, guardados } = crearServicio(
        crearMedico(EstadoUsuario.BAJA),
      );

      await expect(
        servicio.actualizarValorConsulta(7, 20000),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(guardados).toHaveLength(0);
    });

    it('debe rechazar con NotFoundException si el médico no existe', async () => {
      const { servicio } = crearServicio(null);

      await expect(
        servicio.actualizarValorConsulta(7, 20000),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('debe informar el estado del médico en el rechazo de un médico dado de baja', async () => {
      const { servicio } = crearServicio(crearMedico(EstadoUsuario.BAJA));

      await expect(servicio.actualizarValorConsulta(7, 20000)).rejects.toThrow(
        /BAJA/,
      );
    });
  });
});

describe('MedicosService - Arancel vigente', () => {
  describe('Casos de éxito', () => {
    it('debe devolver el valor de consulta de un médico activo', async () => {
      const { servicio } = crearServicio(
        crearMedico(EstadoUsuario.ACTIVO, 18000),
      );

      await expect(servicio.obtenerArancelVigente(7)).resolves.toBe(18000);
    });
  });

  describe('Errores esperados', () => {
    it('debe rechazar con NotFoundException si el médico está dado de baja', async () => {
      const { servicio } = crearServicio(crearMedico(EstadoUsuario.BAJA));

      await expect(servicio.obtenerArancelVigente(7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('debe rechazar con NotFoundException si el médico no existe', async () => {
      const { servicio } = crearServicio(null);

      await expect(servicio.obtenerArancelVigente(7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
