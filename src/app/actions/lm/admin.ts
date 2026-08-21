"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLmAdmin, LmAuthzError } from "@/lib/lm/authz";
import { adminCreateUserSchema, adminUpdateUserSchema, firstZodError } from "@/lib/lm/validation";
import { adminCreateUser, adminUpdateUser, adminSetUserActive, adminDeleteUser } from "@/lib/lm/admin";

export type LmFormState = { error?: string } | null;

export async function adminCreateUserAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  try {
    await requireLmAdmin();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = adminCreateUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  let user;
  try {
    user = await adminCreateUser(parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر إنشاء المستخدم" };
  }

  revalidatePath("/installments/admin/users");
  redirect(`/installments/admin/users/${user.id}`);
}

export async function adminUpdateUserAction(
  id: string,
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  try {
    await requireLmAdmin();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = adminUpdateUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await adminUpdateUser(id, parsed.data);
  revalidatePath("/installments/admin/users");
  revalidatePath(`/installments/admin/users/${id}`);
  redirect(`/installments/admin/users/${id}`);
}

export async function adminToggleUserActiveAction(id: string, isActive: boolean) {
  await requireLmAdmin();
  await adminSetUserActive(id, isActive);
  revalidatePath("/installments/admin/users");
  revalidatePath(`/installments/admin/users/${id}`);
}

export async function adminDeleteUserAction(id: string) {
  await requireLmAdmin();
  await adminDeleteUser(id);
  revalidatePath("/installments/admin/users");
  redirect("/installments/admin/users");
}
