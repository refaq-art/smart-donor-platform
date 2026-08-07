import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return jsonError(firstIssue?.message ?? 'بيانات غير صالحة', 400);
  }
  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }
  return jsonError('حدث خطأ غير متوقع', 500);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new AuthError('يجب تسجيل الدخول أولًا', 401);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== 'ADMIN') {
    throw new AuthError('هذا الإجراء متاح للمسؤولين فقط', 403);
  }
  return session;
}
