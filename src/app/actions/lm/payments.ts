"use server";

import { revalidatePath } from "next/cache";
import { requireLmSession, LmAuthzError } from "@/lib/lm/authz";
import { paymentSchema, firstZodError } from "@/lib/lm/validation";
import { recordLmPayment, deleteLmPayment } from "@/lib/lm/payments";

export type LmFormState = { error?: string; success?: boolean } | null;

export async function recordPaymentAction(
  transactionId: string,
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  let session;
  try {
    session = await requireLmSession();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  try {
    await recordLmPayment(transactionId, session.userId, parsed.data.amount, parsed.data.paymentDate);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر تسجيل الدفعة" };
  }

  revalidatePath(`/installments/transactions/${transactionId}`);
  revalidatePath("/installments/transactions");
  revalidatePath("/installments/dashboard");
  return { success: true };
}

export async function deletePaymentAction(paymentId: string, transactionId: string) {
  const session = await requireLmSession();
  await deleteLmPayment(paymentId, session.userId);
  revalidatePath(`/installments/transactions/${transactionId}`);
  revalidatePath("/installments/transactions");
  revalidatePath("/installments/dashboard");
}
