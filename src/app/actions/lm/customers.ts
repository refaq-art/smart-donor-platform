"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireLmSession, LmAuthzError } from "@/lib/lm/authz";
import { customerSchema, firstZodError } from "@/lib/lm/validation";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/lm/customers";

export type LmFormState = { error?: string } | null;

export async function createCustomerAction(_prev: LmFormState, formData: FormData): Promise<LmFormState> {
  let session;
  try {
    session = await requireLmSession();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const customer = await createCustomer(session.userId, parsed.data.name);
  revalidatePath("/installments/customers");
  redirect(`/installments/customers/${customer.id}`);
}

export async function updateCustomerAction(
  id: string,
  _prev: LmFormState,
  formData: FormData,
): Promise<LmFormState> {
  let session;
  try {
    session = await requireLmSession();
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  try {
    await updateCustomer(id, session.userId, parsed.data.name);
  } catch (e) {
    return { error: e instanceof LmAuthzError ? e.message : "تعذّر التعديل" };
  }

  revalidatePath("/installments/customers");
  revalidatePath(`/installments/customers/${id}`);
  redirect(`/installments/customers/${id}`);
}

export async function deleteCustomerAction(id: string) {
  const session = await requireLmSession();
  await deleteCustomer(id, session.userId);
  revalidatePath("/installments/customers");
  redirect("/installments/customers");
}
