import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLES, SESSION_COOKIE_NAME, type Role } from "@/lib/constants";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // شهر

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-please-32chars-min";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** يجلب المستخدم الحالي كاملًا من قاعدة البيانات، أو null إن لم تكن هناك جلسة صالحة. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return user;
}

/** للاستخدام في صفحات/تخطيطات الخادم المحمية: يوجّه لتسجيل الدخول إن لم يكن هناك مستخدم. */
export async function requireUser(nextPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${suffix}`);
  }
  return user;
}

/** للاستخدام في صفحات/تخطيطات لوحة الإدارة: يوجّه لتسجيل الدخول أو للرئيسية إن لم يكن مسؤولًا. */
export async function requireAdmin(nextPath?: string) {
  const user = await requireUser(nextPath);
  if (user.role !== ROLES.ADMIN) {
    redirect("/");
  }
  return user;
}
