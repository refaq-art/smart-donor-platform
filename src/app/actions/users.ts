"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { requirePermission, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";

const userSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
  role: z.enum([
    ROLES.ADMIN,
    ROLES.ORG_MANAGER,
    ROLES.GRANTS_OFFICER,
    ROLES.REVIEWER,
    ROLES.FINANCE_REVIEWER,
  ]),
});

export type UserFormState = { error?: string; success?: boolean } | null;

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  let session;
  try {
    session = await requirePermission("manageUsers");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { error: "البريد الإلكتروني مستخدم بالفعل" };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
      organizationId: session.organizationId,
      // الحساب الجديد يجب أن يغيّر كلمة المرور المبدئية عند أول دخول
      mustChangePassword: true,
    },
  });

  await audit(session, "create", "User", user.id);

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRoleAction(id: string, role: string) {
  const session = await requirePermission("manageUsers");
  if (id === session.userId) return; // لا يمكن تعديل صلاحية نفسك لمنع فقدان الوصول

  // لا يجوز تعديل مستخدم من جمعية أخرى
  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!target) return;

  await prisma.user.update({ where: { id }, data: { role } });
  await audit(session, "update_role", "User", id, role);
  revalidatePath("/settings/users");
}

/** إعادة تعيين كلمة مرور مستخدم بواسطة المدير، مع إجباره على تغييرها وإبطال جلساته. */
export async function resetUserPasswordAction(id: string, newPassword: string) {
  const session = await requirePermission("manageUsers");
  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!target) return { error: "المستخدم غير موجود" };
  if (newPassword.length < 8) return { error: "كلمة المرور يجب ألا تقل عن 8 أحرف" };

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: true,
      sessionsValidFrom: new Date(),
    },
  });
  await audit(session, "reset_password", "User", id);
  revalidatePath("/settings/users");
  return { success: true };
}

/** تعطيل/تفعيل حساب — يبطل الجلسات فورًا عند التعطيل. */
export async function toggleUserActiveAction(id: string, isActive: boolean) {
  const session = await requirePermission("manageUsers");
  if (id === session.userId) return;
  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!target) return;

  await prisma.user.update({
    where: { id },
    data: { isActive, sessionsValidFrom: isActive ? undefined : new Date() },
  });
  await audit(session, isActive ? "activate_user" : "deactivate_user", "User", id);
  revalidatePath("/settings/users");
}

export async function deleteUserAction(id: string) {
  const session = await requirePermission("manageUsers");
  if (id === session.userId) return; // لا يمكن حذف حسابك الحالي

  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!target) return;

  await prisma.user.delete({ where: { id } });
  await audit(session, "delete", "User", id);
  revalidatePath("/settings/users");
}
