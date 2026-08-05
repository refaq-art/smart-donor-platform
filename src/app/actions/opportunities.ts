"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedOpportunity, requirePermission, audit, AuthzError } from "@/lib/authz";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const oppSchema = z.object({
  title: z.string().min(3, "عنوان الفرصة مطلوب"),
  donorId: z.string().optional(),
  donorNameFreeText: z.string().optional(),
  field: z.string().optional(),
  expectedAmount: z.string().optional(),
  requirements: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  applicationUrl: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
});

export type OpportunityFormState = { error?: string } | null;

function buildData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = oppSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" } as const;
  const d = parsed.data;

  if (d.applicationUrl && d.applicationUrl.trim()) {
    try {
      new URL(d.applicationUrl.trim());
    } catch {
      return { error: "رابط التقديم غير صحيح" } as const;
    }
  }

  return {
    data: {
      title: d.title,
      donorId: d.donorId || null,
      donorNameFreeText: d.donorNameFreeText || null,
      field: d.field || null,
      expectedAmount: d.expectedAmount ? Number(d.expectedAmount) : null,
      requirements: d.requirements || null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      deadline: d.deadline ? new Date(d.deadline) : null,
      applicationUrl: d.applicationUrl || null,
      status: d.status || "مفتوحة",
      projectId: d.projectId || null,
    },
  } as const;
}

export async function createOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  let session;
  try {
    session = await requirePermission("editRecords");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  const opp = await prisma.fundingOpportunity.create({
    data: { ...result.data, organizationId: session.organizationId },
  });
  await audit(session, "create", "FundingOpportunity", opp.id);
  redirect(`/opportunities/${opp.id}`);
}

export async function updateOpportunityAction(
  id: string,
  _prev: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  let session;
  try {
    await requirePermission("editRecords");
    ({ session } = await requireOwnedOpportunity(id));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  await prisma.fundingOpportunity.update({ where: { id }, data: result.data });
  await audit(session, "update", "FundingOpportunity", id);
  redirect(`/opportunities/${id}`);
}

export async function deleteOpportunityAction(id: string) {
  await requirePermission("deleteRecords");
  const { session } = await requireOwnedOpportunity(id);

  await prisma.fundingOpportunity.delete({ where: { id } });
  await audit(session, "delete", "FundingOpportunity", id);
  revalidatePath("/opportunities");
  redirect("/opportunities");
}
