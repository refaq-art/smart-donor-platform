"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, notifyUser } from "@/lib/activity";
import { generateTaskSuggestion, type TaskSuggestionPayload } from "@/lib/ai/recommendations";

async function assertConsultantOwnsOrg(consultantUserId: string, organizationId: string) {
  const org = await prisma.organization.findFirst({ where: { id: organizationId, consultant: { userId: consultantUserId } } });
  if (!org) throw new Error("غير مصرح لك بإدارة هذه الجمعية");
  return org;
}

export async function ensureDevelopmentPlan(organizationId: string) {
  const existing = await prisma.developmentPlan.findFirst({ where: { organizationId } });
  if (existing) return existing;
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const start = org.programStartDate ?? new Date();
  const end = new Date(start.getTime() + 100 * 24 * 60 * 60 * 1000);
  return prisma.developmentPlan.create({ data: { organizationId, startDate: start, endDate: end } });
}

export async function updateGapAction(formData: FormData) {
  const user = await requireUser(["CONSULTANT"]);
  const gapId = String(formData.get("gapId"));
  const gap = await prisma.developmentGap.findUniqueOrThrow({ where: { id: gapId } });
  await assertConsultantOwnsOrg(user.id, gap.organizationId);

  await prisma.developmentGap.update({
    where: { id: gapId },
    data: {
      developmentNeed: String(formData.get("developmentNeed") ?? ""),
      priority: String(formData.get("priority") ?? "MEDIUM"),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath(`/consultant/organizations/${gap.organizationId}/gaps`);
}

export async function generateGapSuggestionAction(gapId: string) {
  const user = await requireUser(["CONSULTANT"]);
  const gap = await prisma.developmentGap.findUniqueOrThrow({ where: { id: gapId } });
  await assertConsultantOwnsOrg(user.id, gap.organizationId);

  const suggestion = await generateTaskSuggestion(gapId);
  await prisma.aIRecommendation.create({
    data: { organizationId: gap.organizationId, developmentGapId: gapId, kind: "TASK", payload: JSON.stringify(suggestion), status: "PENDING" },
  });

  revalidatePath(`/consultant/organizations/${gap.organizationId}/gaps`);
}

export async function respondToRecommendationAction(formData: FormData) {
  const user = await requireUser(["CONSULTANT"]);
  const recommendationId = String(formData.get("recommendationId"));
  const action = String(formData.get("respondAction")); // ACCEPT | EDIT | DISMISS

  const recommendation = await prisma.aIRecommendation.findUniqueOrThrow({ where: { id: recommendationId } });
  await assertConsultantOwnsOrg(user.id, recommendation.organizationId);

  if (action === "DISMISS") {
    await prisma.aIRecommendation.update({ where: { id: recommendationId }, data: { status: "DISMISSED" } });
    revalidatePath(`/consultant/organizations/${recommendation.organizationId}/gaps`);
    return;
  }

  const basePayload = JSON.parse(recommendation.payload) as TaskSuggestionPayload;
  const payload: TaskSuggestionPayload =
    action === "EDIT"
      ? {
          ...basePayload,
          taskTitle: String(formData.get("taskTitle") ?? basePayload.taskTitle),
          description: String(formData.get("description") ?? basePayload.description),
          durationDays: Number(formData.get("durationDays") ?? basePayload.durationDays) || basePayload.durationDays,
          requiredEvidence: String(formData.get("requiredEvidence") ?? basePayload.requiredEvidence),
          priority: (String(formData.get("priority") ?? basePayload.priority) as TaskSuggestionPayload["priority"]) || basePayload.priority,
        }
      : basePayload;

  const plan = await ensureDevelopmentPlan(recommendation.organizationId);
  const gap = recommendation.developmentGapId ? await prisma.developmentGap.findUnique({ where: { id: recommendation.developmentGapId } }) : null;

  const startDate = new Date();
  const dueDate = new Date(startDate.getTime() + payload.durationDays * 24 * 60 * 60 * 1000);

  await prisma.task.create({
    data: {
      developmentPlanId: plan.id,
      developmentGapId: gap?.id,
      title: payload.taskTitle,
      description: `${payload.description}\n\nخطوات التنفيذ:\n${payload.steps?.map((s, i) => `${i + 1}. ${s}`).join("\n") ?? ""}\n\nالمخرجات المتوقعة: ${payload.expectedOutputs}\nالمخاطر: ${payload.risks}`,
      priority: payload.priority,
      startDate,
      dueDate,
      requiredEvidenceText: payload.requiredEvidence,
      status: "NOT_STARTED",
    },
  });

  await prisma.aIRecommendation.update({ where: { id: recommendationId }, data: { status: action === "EDIT" ? "EDITED" : "ACCEPTED" } });

  await logActivity({ organizationId: recommendation.organizationId, actorId: user.id, action: "AI_RECOMMENDATION_" + action, entityType: "AIRecommendation", entityId: recommendationId });

  const orgUsers = await prisma.user.findMany({ where: { organizationId: recommendation.organizationId, role: "ORG" } });
  for (const u of orgUsers) {
    await notifyUser({ userId: u.id, type: "NEW_SUBMISSION", title: "أُضيفت مهمة جديدة لخطة التطوير", body: payload.taskTitle, link: "/org/plan" });
  }

  revalidatePath(`/consultant/organizations/${recommendation.organizationId}/gaps`);
  revalidatePath(`/consultant/organizations/${recommendation.organizationId}/plan`);
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser(["CONSULTANT"]);
  const organizationId = String(formData.get("organizationId"));
  await assertConsultantOwnsOrg(user.id, organizationId);
  const plan = await ensureDevelopmentPlan(organizationId);

  await prisma.task.create({
    data: {
      developmentPlanId: plan.id,
      title: String(formData.get("title")),
      description: String(formData.get("description") ?? "") || null,
      assigneeLabel: String(formData.get("assigneeLabel") ?? "") || null,
      priority: String(formData.get("priority") ?? "MEDIUM"),
      startDate: new Date(String(formData.get("startDate"))),
      dueDate: new Date(String(formData.get("dueDate"))),
      requiredEvidenceText: String(formData.get("requiredEvidenceText") ?? "") || null,
      status: "NOT_STARTED",
    },
  });

  revalidatePath(`/consultant/organizations/${organizationId}/plan`);
}
