"use server";

import { prisma } from "@/lib/prisma";
import {
  createSessionCookie,
  clearSessionCookie,
  verifyPassword,
  getSession,
  hashPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type LoginState = { error?: string } | null;

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

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" };
  }

  if (tooManyAttempts(email)) {
    return { error: "تم تجاوز عدد محاولات الدخول المسموحة. الرجاء المحاولة بعد قليل." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    console.error("login: database query failed", err);
    return {
      error:
        "تعذّر الوصول إلى قاعدة البيانات. إن كان هذا أول تشغيل بعد النشر، فالجداول لم تُنشأ بعد — راجع خطوة تهيئة قاعدة البيانات في ملف README.",
    };
  }

  // رسالة موحّدة لكل حالات الفشل حتى لا نكشف عن وجود البريد من عدمه
  const invalid = { error: "بيانات الدخول غير صحيحة" };

  if (!user) {
    recordFailure(email);
    return invalid;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailure(email);
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "login_failed",
        entityType: "User",
        entityId: user.id,
      },
    });
    return invalid;
  }

  if (!user.isActive) {
    return { error: "هذا الحساب معطّل. الرجاء التواصل مع مدير النظام." };
  }

  failedAttempts.delete(email);

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "login",
      entityType: "User",
      entityId: user.id,
    },
  });

  // الحسابات التي أنشأها المدير يجب أن تغيّر كلمة المرور قبل أي شيء آخر
  if (user.mustChangePassword) redirect("/settings/password?first=1");

  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await prisma.activityLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: "logout",
        entityType: "User",
        entityId: session.userId,
      },
    });
  }
  await clearSessionCookie();
  redirect("/login");
}

export type PasswordState = { error?: string; success?: boolean } | null;

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await getSession();
  if (!session) return { error: "الرجاء تسجيل الدخول" };

  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  if (next.length < 8) return { error: "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف" };
  if (next !== confirm) return { error: "كلمة المرور الجديدة وتأكيدها غير متطابقين" };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "المستخدم غير موجود" };

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { error: "كلمة المرور الحالية غير صحيحة" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(next),
      mustChangePassword: false,
      // إبطال كل الجلسات الأخرى بعد تغيير كلمة المرور
      sessionsValidFrom: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "change_password",
      entityType: "User",
      entityId: user.id,
    },
  });

  // تجديد جلسة المتصفح الحالي حتى لا يُطرد المستخدم بعد تغيير كلمته
  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  });

  revalidatePath("/settings/password");
  return { success: true };
}
