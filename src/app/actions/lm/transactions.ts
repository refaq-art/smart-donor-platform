"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireLmSession, LmAuthzError } from "@/lib/lm/authz";
import { graceTransactionSchema, installmentTransactionSchema, firstZodError } from "@/lib/lm/validation";
import {
  createGraceTransaction,
  createInstallmentTransaction,
  updateTransactionNotes,
  deleteTransaction,
} from "@/lib/lm/transactions";

export type LmFormState = { error?: string } | null;

export async function createGraceTransactionAction(
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  let session;
  try {
    session = await requireLmSession();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = graceTransactionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  let transaction;
  try {
    transaction = await createGraceTransaction(session.userId, parsed.data);
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "تعذّر إنشاء العملية" };
  }

  revalidatePath("/installments/transactions");
  revalidatePath("/installments/dashboard");
  redirect(`/installments/transactions/${transaction.id}`);
}

export async function createInstallmentTransactionAction(
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  let session;
  try {
    session = await requireLmSession();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = installmentTransactionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  let transaction;
  try {
    transaction = await createInstallmentTransaction(session.userId, parsed.data);
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "تعذّر إنشاء العملية" };
  }

  revalidatePath("/installments/transactions");
  revalidatePath("/installments/dashboard");
  redirect(`/installments/transactions/${transaction.id}`);
}

export async function updateTransactionNotesAction(
  id: string,
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  const session = await requireLmSession();
  const notes = String(formData.get("notes") || "");
  try {
    await updateTransactionNotes(id, session.userId, notes);
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "تعذّر التعديل" };
  }
  revalidatePath(`/installments/transactions/${id}`);
  return { error: undefined };
}

export async function deleteTransactionAction(id: string) {
  const session = await requireLmSession();
  await deleteTransaction(id, session.userId);
  revalidatePath("/installments/transactions");
  revalidatePath("/installments/dashboard");
  redirect("/installments/transactions");
}
