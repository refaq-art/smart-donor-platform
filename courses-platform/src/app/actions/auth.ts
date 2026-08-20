"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSessionCookie,
  clearSessionCookie,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  firstErrorMessage,
} from "@/lib/validation";
import { ROLES } from "@/lib/constants";

export type FormState = { error?: string; success?: string } | null;

/** حد بسيط لمحاولات الدخول الفاشلة لكل بريد (في الذاكرة — يكفي لصد المحاولات الآلية البطيئة). */
const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(email: string) {
  const rec = failedAttempts.get(email);
  if (!rec) return false;
  if (Date.now() - rec.firstAt > WINDOW_MS) {
    failedAttempts.delete(email);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(email: string) {
  const rec = failedAttempts.get(email);
  if (!rec || Date.now() - rec.firstAt > WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAt: Date.now() });
  } else {
    rec.count += 1;
  }
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstErrorMessage(parsed.error) };
  }

  const { fullName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "يوجد حساب مسجَّل بهذا البريد الإلكتروني بالفعل" };
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: ROLES.USER,
    },
  });

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as "USER" | "ADMIN",
  });

  const next = String(formData.get("next") || "");
  redirect(next && next.startsWith("/") ? next : "/account/my-courses");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstErrorMessage(parsed.error) };
  }

  const { email, password } = parsed.data;

  if (tooManyAttempts(email)) {
    return { error: "تم تجاوز عدد محاولات الدخول المسموحة. الرجاء المحاولة بعد قليل." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // رسالة موحّدة لكل حالات الفشل حتى لا نكشف عن وجود البريد من عدمه
  const invalid = { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

  if (!user) {
    recordFailure(email);
    return invalid;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailure(email);
    return invalid;
  }

  failedAttempts.delete(email);

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as "USER" | "ADMIN",
  });

  const next = String(formData.get("next") || "");
  redirect(next && next.startsWith("/") ? next : "/account/my-courses");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: firstErrorMessage(parsed.error) };
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // نفس الرسالة سواء وُجد الحساب أم لا، حتى لا نكشف عن وجوده من عدمه
  const genericSuccess = {
    success: "إن كان هناك حساب مرتبط بهذا البريد، فسنرسل رابط استعادة كلمة المرور إليه.",
  };

  if (!user) return genericSuccess;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiresAt: expiresAt },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/reset-password?token=${token}`;
  const result = await sendPasswordResetEmail(user.email, resetUrl);

  if (result.devMode) {
    return {
      success: `وضع التطوير: لا يوجد مزوّد بريد مُفعَّل، إليك رابط الاستعادة مباشرة: ${result.resetUrl}`,
    };
  }

  return genericSuccess;
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: firstErrorMessage(parsed.error) };
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "رابط الاستعادة غير صالح أو منتهي الصلاحية. الرجاء طلب رابط جديد." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  });

  redirect("/login?reset=1");
}
