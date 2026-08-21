// مصادقة مستقلة كليًا عن مصادقة منصة المشاريع والمنح (src/lib/auth.ts):
// كعكة جلسة مختلفة الاسم، سر توقيع مختلف، وحمولة (payload) خاصة بمستخدمي
// هذه الوحدة. هذا يضمن عدم تداخل الجلستين إطلاقًا حتى لو استُخدمتا في نفس
// المتصفح في آنٍ واحد.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const LM_SESSION_COOKIE = "lm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // شهر

function getSecretKey() {
  const secret = process.env.LM_AUTH_SECRET || "dev-only-insecure-lm-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type LmSessionPayload = {
  userId: string;
  phone: string;
  name: string;
  role: string;
  // وقت إصدار الرمز (ثوانٍ منذ Epoch) — يُقارَن بـ sessionsValidFrom للمستخدم
  // لإبطال الجلسات القديمة فورًا بعد تغيير كلمة المرور أو تعطيل الحساب.
  issuedAt: number;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type LmSessionInput = Omit<LmSessionPayload, "issuedAt">;

export async function createLmSessionCookie(payload: LmSessionInput) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(LM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearLmSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(LM_SESSION_COOKIE);
}

function payloadFromClaims(payload: Record<string, unknown>): LmSessionPayload {
  return {
    userId: payload.userId as string,
    phone: payload.phone as string,
    name: payload.name as string,
    role: payload.role as string,
    issuedAt: payload.iat as number,
  };
}

export async function getLmSession(): Promise<LmSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LM_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payloadFromClaims(payload);
  } catch {
    return null;
  }
}

export async function verifyLmSessionToken(token: string): Promise<LmSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payloadFromClaims(payload);
  } catch {
    return null;
  }
}
