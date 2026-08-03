"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit as canEditRole, canDelete as canDeleteRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const projectSchema = z.object({
  title: z.string().min(3, "اسم المشروع مطلوب (3 أحرف على الأقل)"),
  category: z.string().optional(),
  problemStatement: z.string().optional(),
  generalObjective: z.string().optional(),
  beneficiaryCategory: z.string().optional(),
  beneficiaryCount: z.string().optional(),
  geographicScope: z.string().optional(),
  timelineStart: z.string().optional(),
  timelineEnd: z.string().optional(),
  budgetTotal: z.string().optional(),
  status: z.string().optional(),
  specificObjectivesJson: z.string().optional(),
  activitiesJson: z.string().optional(),
  outputsJson: z.string().optional(),
  outcomesJson: z.string().optional(),
  kpisJson: z.string().optional(),
  budgetBreakdownJson: z.string().optional(),
});

export type ProjectFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

function buildData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" } as const;
  }
  const d = parsed.data;
  return {
    data: {
      title: d.title,
      category: d.category || null,
      problemStatement: d.problemStatement || null,
      generalObjective: d.generalObjective || null,
      specificObjectives: d.specificObjectivesJson || "[]",
      beneficiaryCategory: d.beneficiaryCategory || null,
      beneficiaryCount: d.beneficiaryCount ? Number(d.beneficiaryCount) : null,
      geographicScope: d.geographicScope || null,
      activities: d.activitiesJson || "[]",
      outputs: d.outputsJson || "[]",
      outcomes: d.outcomesJson || "[]",
      kpis: d.kpisJson || "[]",
      timelineStart: d.timelineStart ? new Date(d.timelineStart) : null,
      timelineEnd: d.timelineEnd ? new Date(d.timelineEnd) : null,
      budgetTotal: d.budgetTotal ? Number(d.budgetTotal) : null,
      budgetBreakdown: d.budgetBreakdownJson || "[]",
      status: d.status || "مسودة",
    },
  } as const;
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لإنشاء مشروع" };

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  const project = await prisma.project.create({
    data: { ...result.data, createdById: session.userId },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "create", entityType: "Project", entityId: project.id },
  });

  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  id: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return { error: "ليست لديك صلاحية لتعديل هذا المشروع" };

  const result = buildData(formData);
  if ("error" in result) return { error: result.error };

  await prisma.project.update({ where: { id }, data: result.data });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "update", entityType: "Project", entityId: id },
  });

  redirect(`/projects/${id}`);
}

export async function duplicateProjectAction(id: string) {
  const session = await getSession();
  if (!session || !canEditRole(session.role)) return;

  const original = await prisma.project.findUnique({ where: { id } });
  if (!original) return;

  const copy = await prisma.project.create({
    data: {
      title: `نسخة من ${original.title}`,
      category: original.category,
      problemStatement: original.problemStatement,
      generalObjective: original.generalObjective,
      specificObjectives: original.specificObjectives,
      beneficiaryCategory: original.beneficiaryCategory,
      beneficiaryCount: original.beneficiaryCount,
      geographicScope: original.geographicScope,
      activities: original.activities,
      outputs: original.outputs,
      outcomes: original.outcomes,
      kpis: original.kpis,
      timelineStart: original.timelineStart,
      timelineEnd: original.timelineEnd,
      budgetTotal: original.budgetTotal,
      budgetBreakdown: original.budgetBreakdown,
      status: "مسودة",
      duplicatedFromId: original.id,
      createdById: session.userId,
    },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "duplicate", entityType: "Project", entityId: copy.id },
  });

  redirect(`/projects/${copy.id}/edit`);
}

export async function deleteProjectAction(id: string) {
  const session = await getSession();
  if (!session || !canDeleteRole(session.role)) return;

  await prisma.project.delete({ where: { id } });

  await prisma.activityLog.create({
    data: { userId: session.userId, action: "delete", entityType: "Project", entityId: id },
  });

  revalidatePath("/projects");
  redirect("/projects");
}
