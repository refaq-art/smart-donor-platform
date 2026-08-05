"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedDonor, requirePermission, audit, AuthzError } from "@/lib/authz";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const donorSchema = z.object({
  name: z.string().min(2, "اسم الجهة مطلوب"),
  type: z.string().optional(),
  supportFields: z.string().optional(),
  fundingConditions: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  relationshipStatus: z.string().optional(),
  notes: z.string().optional(),
});

export type DonorFormState = { error?: string } | null;

function buildData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = donorSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" } as const;
  const d = parsed.data;
  if (d.email && d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    return { error: "صيغة البريد الإلكتروني غير صحيحة" } as const;
  }
  return {
    data: {
      name: d.name,
      type: d.type || null,
      supportFields: d.supportFields || null,
      fundingConditions: d.fundingConditions || null,
      contactName: d.contactName || null,
      phone: d.phone || null,
      email: d.email || null,
      city: d.city || null,
      relationshipStatus: d.relationshipStatus || "محتمل",
      notes: d.notes || null,
    },
  } as const;
}

export async function createDonorAction(_prev: DonorFormState, formData: FormData): Promise<DonorFormState> {
  let session;
  try {
    session = await requirePermission("editRecords");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  const donor = await prisma.donor.create({
    data: { ...result.data, organizationId: session.organizationId },
  });
  await audit(session, "create", "Donor", donor.id);
  redirect(`/donors/${donor.id}`);
}

export async function updateDonorAction(
  id: string,
  _prev: DonorFormState,
  formData: FormData
): Promise<DonorFormState> {
  let session;
  try {
    await requirePermission("editRecords");
    ({ session } = await requireOwnedDonor(id));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  await prisma.donor.update({ where: { id }, data: result.data });
  await audit(session, "update", "Donor", id);
  redirect(`/donors/${id}`);
}

export async function deleteDonorAction(id: string) {
  await requirePermission("deleteRecords");
  const { session } = await requireOwnedDonor(id);

  await prisma.donor.delete({ where: { id } });
  await audit(session, "delete", "Donor", id);
  revalidatePath("/donors");
  redirect("/donors");
}
