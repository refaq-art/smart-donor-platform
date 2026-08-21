"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  createLmSessionCookie,
  clearLmSessionCookie,
  hashPassword,
  verifyPassword,
  getLmSession,
} from "@/lib/lm/auth";
import { registerSchema, loginSchema, normalizeSaudiPhone, firstZodError } from "@/lib/lm/validation";

export type LmFormState = { error?: string } | null;

export async function registerAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const normalizedPhone = normalizeSaudiPhone(parsed.data.phone)!;

  const existing = await prisma.lmUser.findUnique({ where: { phone: normalizedPhone } });
  if (existing) return { error: "رقم الجوال مسجَّل بالفعل. يمكنك تسجيل الدخول مباشرة." };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.lmUser.create({
    data: { name: parsed.data.name, phone: normalizedPhone, passwordHash },
  });

  await createLmSessionCookie({ userId: user.id, phone: user.phone, name: user.name, role: user.role });
  redirect("/installments/dashboard");
}

export async function loginAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const normalizedPhone = normalizeSaudiPhone(parsed.data.phone);
  if (!normalizedPhone) return { error: "رقم جوال غير صحيح" };

  const user = await prisma.lmUser.findUnique({ where: { phone: normalizedPhone } });
  if (!user) return { error: "رقم الجوال أو كلمة المرور غير صحيحة" };
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "رقم الجوال أو كلمة المرور غير صحيحة" };
  }
  if (!user.isActive) return { error: "هذا الحساب معطَّل. تواصل مع مدير النظام." };

  await prisma.lmUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createLmSessionCookie({ userId: user.id, phone: user.phone, name: user.name, role: user.role });
  redirect("/installments/dashboard");
}

export async function logoutAction() {
  await clearLmSessionCookie();
  redirect("/installments/login");
}

export async function getCurrentLmUser() {
  const session = await getLmSession();
  if (!session) return null;
  return prisma.lmUser.findUnique({ where: { id: session.userId } });
}
