"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { canManageUsers, ROLES } from "@/lib/roles";
import { revalidatePath } from "next/cache";

const userSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
  role: z.enum([ROLES.ADMIN, ROLES.ORG_MANAGER, ROLES.GRANTS_OFFICER, ROLES.REVIEWER]),
});

export type UserFormState = { error?: string; success?: boolean } | null;

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) return { error: "ليست لديك صلاحية لإدارة المستخدمين" };

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
    },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "create", entityType: "User", entityId: user.id },
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRoleAction(id: string, role: string) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) return;
  if (id === session.userId) return; // لا يمكن تعديل صلاحية نفسك لمنع فقدان الوصول

  await prisma.user.update({ where: { id }, data: { role } });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "update_role", entityType: "User", entityId: id, details: role },
  });
  revalidatePath("/settings/users");
}

export async function deleteUserAction(id: string) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) return;
  if (id === session.userId) return; // لا يمكن حذف حسابك الحالي

  await prisma.user.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "delete", entityType: "User", entityId: id },
  });
  revalidatePath("/settings/users");
}
