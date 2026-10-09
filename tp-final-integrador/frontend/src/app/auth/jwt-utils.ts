import type { JwtPayload } from './auth-dto';

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const partes = token.split('.');
  if (partes.length < 2) {
    return null;
  }
  try {
    const base64Url = partes[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonPayload = new TextDecoder().decode(bytes);
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}
