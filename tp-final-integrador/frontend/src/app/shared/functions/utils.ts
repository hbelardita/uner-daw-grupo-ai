export function obtenerInicialesUsuario(
  nombres: string | null | undefined,
  apellidos: string | null | undefined,
): string {
  const inicialNombre = nombres?.trim().charAt(0) ?? '';
  const inicialApellido = apellidos?.trim().charAt(0) ?? '';
  const combinadas = `${inicialNombre}${inicialApellido}`.toUpperCase();
  return combinadas || 'U';
}

export function formatearDocumento(documento: string | null | undefined): string {
  const limpio = (documento ?? '').replace(/\D/g, '');
  if (!limpio) {
    return '';
  }
  return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatearFechaHoraTurno(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return fechaIso;

    const partes = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).formatToParts(fecha);

    const diaSemana = partes.find((p) => p.type === 'weekday')?.value ?? '';
    const dia = partes.find((p) => p.type === 'day')?.value ?? '';
    const mes = partes.find((p) => p.type === 'month')?.value ?? '';
    const anio = partes.find((p) => p.type === 'year')?.value ?? '';
    const diaCapitalizado = diaSemana ? diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1) : '';

    const horaStr = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(fecha);

    return `${diaCapitalizado} ${dia}/${mes}/${anio} · ${horaStr} hs`;
  } catch {
    return fechaIso;
  }
}
