"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireLmSession } from "@/lib/lm/authz";
import { accountUpdateSchema, passwordChangeSchema, firstZodError } from "@/lib/lm/validation";
import { hashPassword, verifyPassword } from "@/lib/lm/auth";

export type LmFormState = { error?: string; success?: boolean } | null;

export async function updateAccountAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  const session = await requireLmSession();
  const parsed = accountUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await prisma.lmUser.update({ where: { id: session.userId }, data: { name: parsed.data.name } });
  revalidatePath("/installments/account");
  return { success: true };
}

export async function changePasswordAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  const session = await requireLmSession();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const user = await prisma.lmUser.findUniqueOrThrow({ where: { id: session.userId } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "كلمة المرور الحالية غير صحيحة" };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  // إبطال كل الجلسات السابقة عند تغيير كلمة المرور (بما فيها الجلسة الحالية
  // تقنيًا، لكن الكعكة الحالية تبقى صالحة حتى تسجيل الخروج التالي أو انتهاء
  // مدتها الطبيعية — وهو سلوك مقبول ومطابق لنفس منطق منصة المشاريع والمنح).
  await prisma.lmUser.update({
    where: { id: session.userId },
    data: { passwordHash: newHash, sessionsValidFrom: new Date() },
  });

  return { success: true };
}
