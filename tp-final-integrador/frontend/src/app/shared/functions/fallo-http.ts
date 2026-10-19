import { HttpErrorResponse } from '@angular/common/http';

export interface TextosFalloHttp {
  readonly desincronizado: string;
  readonly sinPermiso: string;
  readonly generico: string;
}

/**
 * Fallo de una operación sobre un turno ya interpretado.
 * Invariante. 'mensaje' trae texto del backend sólo cuando ese texto sirve para mostrar al usuario.
 */
export interface FalloHttp {
  readonly mensaje: string;
  readonly requiereRecargar: boolean;
}

/**
 * Interpreta el fallo de una operación sobre un turno.
 *
 * Reglas:
 * - 409 y 404 significan que la lista local quedó vieja. Piden recargar.
 * - 403 muestra el texto del backend cuando existe, o el del permiso.
 * - Un 5xx nunca muestra el texto del backend. Tampoco un fallo sin respuesta HTTP.
 * - El resto de los status muestran el texto del backend, porque un 400 de negocio explica la regla incumplida.
 */
export function clasificarFalloHttp(error: unknown, textos: TextosFalloHttp): FalloHttp {
  if (!(error instanceof HttpErrorResponse)) {
    return { mensaje: textos.generico, requiereRecargar: false };
  }

  const mensajeServidor = error.status < 500 ? mensajeDelCuerpo(error.error) : null;

  if (error.status === 409 || error.status === 404) {
    return { mensaje: mensajeServidor ?? textos.desincronizado, requiereRecargar: true };
  }

  if (error.status === 403) {
    return { mensaje: mensajeServidor ?? textos.sinPermiso, requiereRecargar: false };
  }

  return { mensaje: mensajeServidor ?? textos.generico, requiereRecargar: false };
}

function mensajeDelCuerpo(cuerpo: unknown): string | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null;
  }
  const mensaje = (cuerpo as { message?: unknown }).message;
  return typeof mensaje === 'string' && mensaje.trim() !== '' ? mensaje : null;
}
