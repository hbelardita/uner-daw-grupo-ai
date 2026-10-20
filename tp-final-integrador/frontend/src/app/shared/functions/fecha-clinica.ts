/** Zona horaria única de la clínica. */
export const ZONA_HORARIA_CLINICA = 'America/Argentina/Buenos_Aires';

/** Offset fijo de Argentina respecto de UTC. */
export const OFFSET_CLINICA = '-03:00';

const formateadorFechaIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formateadorFechaLarga = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA_CLINICA,
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formateadorHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA_CLINICA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function crearInstanteClinico(fechaIso: string, hora: string): Date {
  return new Date(`${fechaIso}T${hora}${OFFSET_CLINICA}`);
}

/**
 * Instante del mediodía clínico. El ancla del mediodía evita corrimientos de día
 * al convertir entre instantes y fechas de calendario.
 */
export function crearInstanteMediodiaClinica(fechaIso: string): Date {
  return crearInstanteClinico(fechaIso, '12:00:00');
}

/** Instante del inicio del día clínico (00:00:00). */
export function crearInstanteInicioDiaClinica(fechaIso: string): Date {
  return crearInstanteClinico(fechaIso, '00:00:00');
}

/**
 * Fecha de calendario local 'YYYY-MM-DD' en la zona de la clínica.
 * Retorna cadena vacía si el instante no es válido.
 */
export function obtenerFechaLocalIso(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  return formateadorFechaIso.format(fecha);
}

/** Indica si dos instantes caen en el mismo día de calendario de la clínica. */
export function esMismaFechaLocal(izquierda: Date, derecha: Date): boolean {
  const izquierdaIso = obtenerFechaLocalIso(izquierda);

  return izquierdaIso !== '' && izquierdaIso === obtenerFechaLocalIso(derecha);
}

/**
 * Formatea un instante como 'Lunes 19/10/2026'.
 * Retorna cadena vacía si el instante no es válido.
 */
export function formatearFechaLargaClinica(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const texto = formateadorFechaLarga.format(fecha).replace(',', '');

  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

/**
 * Formatea un instante como 'HH:mm' en la zona de la clínica.
 * Retorna cadena vacía si el instante no es válido.
 */
export function formatearHoraClinica(instante: Date): string {
  if (Number.isNaN(instante.getTime())) {
    return '';
  }

  const partes = formateadorHora.formatToParts(instante);
  const horaParte = partes.find((parte) => parte.type === 'hour')?.value ?? '00';
  const minutoParte = partes.find((parte) => parte.type === 'minute')?.value ?? '00';
  const horaNormalizada = horaParte === '24' ? '00' : horaParte.padStart(2, '0');

  return `${horaNormalizada}:${minutoParte.padStart(2, '0')}`;
}

/**
 * Extrae la hora 'HH:mm' de una fecha/hora en la zona de la clínica.
 * Si la cadena no trae offset se interpreta como hora clínica.
 * Retorna cadena vacía si no se puede interpretar.
 */
export function extraerHoraClinica(fechaHora: string): string {
  const tieneOffset = fechaHora.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(fechaHora);
  const fechaIso = tieneOffset ? fechaHora : `${fechaHora}${OFFSET_CLINICA}`;

  return formatearHoraClinica(new Date(fechaIso));
}

/**
 * Formatea una fecha/hora ISO como 'Lunes 19/10/2026 · 10:00 hs'.
 * Retorna la cadena original si no se puede interpretar.
 */
export function formatearFechaHoraClinica(fechaHora: string): string {
  const instante = new Date(fechaHora);

  if (Number.isNaN(instante.getTime())) {
    return fechaHora;
  }

  return `${formatearFechaLargaClinica(instante)} · ${formatearHoraClinica(instante)} hs`;
}

/**
 * Suma una hora a un horario 'HH:mm', sin salir del rango de un día.
 * Retorna cadena vacía si el horario no tiene el formato esperado.
 */
export function sumarUnaHora(hora: string): string {
  const coincidencia = /^(\d{2}):(\d{2})$/.exec(hora);

  if (!coincidencia) {
    return '';
  }

  const horas = (Number(coincidencia[1]) + 1) % 24;

  return `${String(horas).padStart(2, '0')}:${coincidencia[2]}`;
}
