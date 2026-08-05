"use server";

import { prisma } from "@/lib/prisma";
import { createSessionCookie, clearSessionCookie, verifyPassword, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" };
  }

  let user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    // أشيع سبب هنا هو قاعدة بيانات لم تُهيَّأ بعد (الجداول غير موجودة) — نعرض رسالة
    // واضحة بدل صفحة خطأ عامة لا تدل على شيء.
    console.error("login: database query failed", err);
    return {
      error:
        "تعذّر الوصول إلى قاعدة البيانات. إن كان هذا أول تشغيل بعد النشر، فالجداول لم تُنشأ بعد — راجع خطوة تهيئة قاعدة البيانات في ملف README.",
    };
  }

  if (!user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "login", entityType: "User", entityId: user.id },
  });

  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await prisma.activityLog.create({
      data: { userId: session.userId, action: "logout", entityType: "User", entityId: session.userId },
    });
  }
  await clearSessionCookie();
  redirect("/login");
}
