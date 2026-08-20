"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, createSessionCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { updateProfileSchema, changePasswordSchema, firstErrorMessage } from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "الرجاء تسجيل الدخول" };

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: firstErrorMessage(parsed.error) };

  const { fullName, phone } = parsed.data;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { fullName, phone: phone || null },
  });

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as "USER" | "ADMIN",
  });

  revalidatePath("/account/profile");
  return { success: "تم تحديث بياناتك بنجاح" };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "الرجاء تسجيل الدخول" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstErrorMessage(parsed.error) };

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "المستخدم غير موجود" };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: "كلمة المرور الحالية غير صحيحة" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { success: "تم تغيير كلمة المرور بنجاح" };
}
