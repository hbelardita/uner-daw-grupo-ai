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
