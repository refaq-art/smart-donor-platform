import type { Socket } from 'socket.io';
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from '@/lib/jwt';

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) continue;
    result[key] = decodeURIComponent(rest.join('='));
  }
  return result;
}

export async function authenticateSocket(socket: Socket): Promise<SessionPayload | null> {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}
