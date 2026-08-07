import { SignJWT, jwtVerify } from 'jose';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 يومًا

export function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET غير معرّف في متغيرات البيئة');
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  playerId: string;
  userId: string | null;
  role: 'PLAYER' | 'ADMIN';
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.playerId !== 'string') return null;
    return {
      playerId: payload.playerId,
      userId: (payload.userId as string | null) ?? null,
      role: (payload.role as 'PLAYER' | 'ADMIN') ?? 'PLAYER',
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'quiz_session';
export const SESSION_TTL = SESSION_TTL_SECONDS;
