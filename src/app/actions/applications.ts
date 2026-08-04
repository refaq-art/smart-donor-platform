"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit as canEditRole, canDelete as canDeleteRole, canChangeStatus } from "@/lib/roles";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APPLICATION_STATUSES } from "@/lib/constants";

const newAppSchema = z.object({
  title: z.string().min(3, "عنوان الطلب مطلوب"),
  projectId: z.string().min(1, "الرجاء اختيار المشروع"),
  opportunityId: z.string().optional(),
});

export type ApplicationFormState = { error?: string } | null;

export async function createApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لإنشاء طلب منحة" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = newAppSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  const app = await prisma.grantApplication.create({
    data: {
      title: parsed.data.title,
      projectId: parsed.data.projectId,
      opportunityId: parsed.data.opportunityId || null,
      status: "مسودة",
      createdById: session.userId,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: app.id, toStatus: "مسودة", changedById: session.userId, note: "تم إنشاء الطلب" },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "create", entityType: "GrantApplication", entityId: app.id },
  });

  redirect(`/applications/${app.id}`);
}

const contentSchema = z.object({
  title: z.string().min(3),
  executiveSummary: z.string().optional(),
  orgIntroduction: z.string().optional(),
  problemStatement: z.string().optional(),
  justification: z.string().optional(),
  objectives: z.string().optional(),
  beneficiaries: z.string().optional(),
  implementationPlan: z.string().optional(),
  activities: z.string().optional(),
  outputs: z.string().optional(),
  outcomes: z.string().optional(),
  kpis: z.string().optional(),
  riskManagement: z.string().optional(),
  sustainability: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  donorRequirements: z.string().optional(),
  opportunityId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type ApplicationContentState = { error?: string; savedAt?: number } | null;

export async function updateApplicationContentAction(
  id: string,
  _prev: ApplicationContentState,
  formData: FormData
): Promise<ApplicationContentState> {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لتعديل هذا الطلب" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  const d = parsed.data;
  await prisma.grantApplication.update({
    where: { id },
    data: {
      title: d.title,
      executiveSummary: d.executiveSummary || null,
      orgIntroduction: d.orgIntroduction || null,
      problemStatement: d.problemStatement || null,
      justification: d.justification || null,
      objectives: d.objectives || null,
      beneficiaries: d.beneficiaries || null,
      implementationPlan: d.implementationPlan || null,
      activities: d.activities || null,
      outputs: d.outputs || null,
      outcomes: d.outcomes || null,
      kpis: d.kpis || null,
      riskManagement: d.riskManagement || null,
      sustainability: d.sustainability || null,
      timeline: d.timeline || null,
      budget: d.budget || null,
      donorRequirements: d.donorRequirements || null,
      opportunityId: d.opportunityId || null,
      assignedToId: d.assignedToId || null,
    },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "update", entityType: "GrantApplication", entityId: id },
  });

  revalidatePath(`/applications/${id}`);
  return { savedAt: Date.now() };
}

const statusSchema = z.object({
  toStatus: z.enum(APPLICATION_STATUSES),
  note: z.string().optional(),
  nextStep: z.string().optional(),
});

export type StatusChangeState = { error?: string; savedAt?: number } | null;

export async function changeApplicationStatusAction(
  id: string,
  _prev: StatusChangeState,
  formData: FormData
): Promise<StatusChangeState> {
  const session = await getSession();
  if (!session || !canChangeStatus(session.role)) return { error: "ليست لديك صلاحية لتغيير حالة الطلب" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return { error: "الرجاء اختيار حالة صحيحة" };

  const current = await prisma.grantApplication.findUnique({ where: { id } });
  if (!current) return { error: "الطلب غير موجود" };

  await prisma.$transaction([
    prisma.grantApplication.update({ where: { id }, data: { status: parsed.data.toStatus } }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: current.status,
        toStatus: parsed.data.toStatus,
        note: parsed.data.note || null,
        nextStep: parsed.data.nextStep || null,
        changedById: session.userId,
      },
    }),
  ]);

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "status_change",
      entityType: "GrantApplication",
      entityId: id,
      details: `${current.status} -> ${parsed.data.toStatus}`,
    },
  });

  revalidatePath(`/applications/${id}`);
  return { savedAt: Date.now() };
}

export async function deleteApplicationAction(id: string) {
  const session = await getSession();
  if (!session || !canDeleteRole(session.role)) return;

  await prisma.grantApplication.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: session.userId, action: "delete", entityType: "GrantApplication", entityId: id },
  });
  revalidatePath("/applications");
  redirect("/applications");
}
