"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit as canEditRole, canDelete as canDeleteRole } from "@/lib/roles";
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
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لإضافة جهة مانحة" };

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  const donor = await prisma.donor.create({ data: result.data });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "create", entityType: "Donor", entityId: donor.id },
  });
  redirect(`/donors/${donor.id}`);
}

export async function updateDonorAction(
  id: string,
  _prev: DonorFormState,
  formData: FormData
): Promise<DonorFormState> {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لتعديل هذه الجهة" };

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  await prisma.donor.update({ where: { id }, data: result.data });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "update", entityType: "Donor", entityId: id },
  });
  redirect(`/donors/${id}`);
}

export async function deleteDonorAction(id: string) {
  const session = await getSession();
  if (!session || !canDeleteRole(session.role)) return;

  await prisma.donor.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "delete", entityType: "Donor", entityId: id },
  });
  revalidatePath("/donors");
  redirect("/donors");
}
