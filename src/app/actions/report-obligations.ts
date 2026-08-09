"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, requireSessionOrThrow, requirePermission, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { REPORT_OBLIGATION_TYPES } from "@/lib/constants";

const obligationSchema = z.object({
  title: z.string().min(2, "الرجاء كتابة عنوان التقرير"),
  type: z.enum(REPORT_OBLIGATION_TYPES),
  dueDate: z.string().min(1, "الرجاء تحديد الموعد المستحق"),
  notes: z.string().optional(),
});

export type ReportObligationFormState = { error?: string } | null;

export async function addReportObligationAction(
  applicationId: string,
  _prev: ReportObligationFormState,
  formData: FormData
): Promise<ReportObligationFormState> {
  let session;
  try {
    await requirePermission("editRecords");
    ({ session } = await requireOwnedApplication(applicationId));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = obligationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) return { error: "تاريخ الاستحقاق غير صحيح" };

  await prisma.donorReportObligation.create({
    data: {
      applicationId,
      organizationId: session.organizationId,
      title: parsed.data.title,
      type: parsed.data.type,
      dueDate,
      notes: parsed.data.notes || null,
      createdById: session.userId,
    },
  });

  await audit(session, "add_report_obligation", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
  return null;
}

export async function setReportObligationSubmittedAction(id: string, applicationId: string, submitted: boolean) {
  const session = await requireSessionOrThrow();
  await requirePermission("editRecords");

  const obligation = await prisma.donorReportObligation.findFirst({
    where: { id, applicationId, organizationId: session.organizationId },
  });
  if (!obligation) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");

  await prisma.donorReportObligation.update({
    where: { id },
    data: { status: submitted ? "SUBMITTED" : "PENDING", submittedAt: submitted ? new Date() : null },
  });

  await audit(session, submitted ? "submit_report_obligation" : "reopen_report_obligation", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
}

export async function deleteReportObligationAction(id: string, applicationId: string) {
  const session = await requireSessionOrThrow();
  await requirePermission("editRecords");

  const obligation = await prisma.donorReportObligation.findFirst({
    where: { id, applicationId, organizationId: session.organizationId },
  });
  if (!obligation) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");

  await prisma.donorReportObligation.delete({ where: { id } });
  await audit(session, "delete_report_obligation", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
}
