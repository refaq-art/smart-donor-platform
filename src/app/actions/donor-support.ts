"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedDonor, requireSessionOrThrow, requirePermission, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";

const supportRecordSchema = z.object({
  year: z.coerce.number().int().min(1990).max(2100),
  amount: z.coerce.number().min(0),
  projectId: z.string().optional(),
  notes: z.string().optional(),
});

export type SupportRecordFormState = { error?: string } | null;

export async function addSupportRecordAction(
  donorId: string,
  _prev: SupportRecordFormState,
  formData: FormData
): Promise<SupportRecordFormState> {
  let session;
  try {
    await requirePermission("editRecords");
    ({ session } = await requireOwnedDonor(donorId));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = supportRecordSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  let projectId: string | null = null;
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, organizationId: session.organizationId },
      select: { id: true },
    });
    projectId = project?.id || null;
  }

  await prisma.donorSupportRecord.create({
    data: {
      donorId,
      organizationId: session.organizationId,
      year: parsed.data.year,
      amount: parsed.data.amount,
      projectId,
      notes: parsed.data.notes || null,
      createdById: session.userId,
    },
  });

  await audit(session, "add_support_record", "Donor", donorId);
  revalidatePath(`/donors/${donorId}`);
  return null;
}

export async function deleteSupportRecordAction(id: string, donorId: string) {
  const session = await requireSessionOrThrow();
  await requirePermission("editRecords");

  const record = await prisma.donorSupportRecord.findFirst({
    where: { id, donorId, organizationId: session.organizationId },
  });
  if (!record) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");

  await prisma.donorSupportRecord.delete({ where: { id } });
  await audit(session, "delete_support_record", "Donor", donorId);
  revalidatePath(`/donors/${donorId}`);
}
