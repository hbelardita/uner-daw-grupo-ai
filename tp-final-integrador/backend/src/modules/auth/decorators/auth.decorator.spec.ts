import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Auth } from './auth.decorator.js';
import { ROLES_KEY } from './roles.decorator.js';

class ControladorPrueba {
  endpointPublico() {}
}

// El decorator se aplica explícitamente al target: applyDecorators
// delega la escritura de metadata en el objeto decorado, no en la
// función Auth en sí. A nivel de método se reproduce la firma real
// (target, key, descriptor) que TypeScript invoca en compilación.
const descriptor = Object.getOwnPropertyDescriptor(
  ControladorPrueba.prototype,
  'endpointPublico',
)!;

Auth()(ControladorPrueba);
Auth(RolUsuario.MEDICO, RolUsuario.ADMINISTRADOR)(
  ControladorPrueba.prototype,
  'endpointPublico',
  descriptor,
);

describe('Auth (Composición de guards de autenticación y autorización)', () => {
  it('debe aplicar AuthGuard y RolesGuard en ese orden exacto', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ControladorPrueba);

    expect(guards).toEqual([AuthGuard, RolesGuard]);
  });

  it('debe aplicar ambos guards también a nivel de método', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ControladorPrueba.prototype.endpointPublico,
    );

    expect(guards).toEqual([AuthGuard, RolesGuard]);
  });

  it('debe registrar un arreglo vacío de roles cuando no se indican', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, ControladorPrueba);

    expect(roles).toEqual([]);
  });

  it('debe registrar los roles requeridos a nivel de método', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      ControladorPrueba.prototype.endpointPublico,
    );

    expect(roles).toEqual([RolUsuario.MEDICO, RolUsuario.ADMINISTRADOR]);
  });
});
