"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { logActivity, notifyUser } from "@/lib/activity";

async function loadTaskWithAccess(taskId: string, userId: string, role: "ORG" | "CONSULTANT") {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { developmentPlan: { include: { organization: { include: { consultant: true } } } } },
  });
  const org = task.developmentPlan.organization;
  if (role === "ORG") {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.organizationId !== org.id) throw new Error("غير مصرح لك بالوصول لهذه المهمة");
  } else {
    if (org.consultant?.userId !== userId) throw new Error("غير مصرح لك بالوصول لهذه المهمة");
  }
  return task;
}

export async function uploadTaskEvidenceAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const taskId = String(formData.get("taskId"));
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const file = formData.get("file") as File | null;
  await loadTaskWithAccess(taskId, user.id, "ORG");

  if (file && file.size > 0) {
    const saved = await saveUploadedFile(file);
    await prisma.taskEvidence.create({ data: { taskId, fileName: saved.fileName, fileUrl: saved.fileUrl, uploadedById: user.id } });
  } else if (linkUrl) {
    await prisma.taskEvidence.create({ data: { taskId, fileName: linkUrl, linkUrl, uploadedById: user.id } });
  } else {
    throw new Error("يرجى إرفاق ملف أو رابط");
  }

  revalidatePath(`/org/tasks/${taskId}`);
  revalidatePath("/org/plan");
}

export async function updateTaskProgressAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const taskId = String(formData.get("taskId"));
  const progressPercent = Number(formData.get("progressPercent") ?? 0);
  const orgNotes = String(formData.get("orgNotes") ?? "");
  const task = await loadTaskWithAccess(taskId, user.id, "ORG");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      orgNotes: orgNotes || null,
      status: task.status === "NOT_STARTED" && progressPercent > 0 ? "IN_PROGRESS" : task.status === "LATE" && progressPercent > 0 ? "IN_PROGRESS" : task.status,
    },
  });

  revalidatePath(`/org/tasks/${taskId}`);
  revalidatePath("/org/plan");
}

export async function submitTaskForReviewAction(taskId: string) {
  const user = await requireUser(["ORG"]);
  const task = await loadTaskWithAccess(taskId, user.id, "ORG");
  const evidenceCount = await prisma.taskEvidence.count({ where: { taskId } });
  if (evidenceCount === 0) throw new Error("يرجى رفع شاهد الإنجاز أولًا قبل إرسال المهمة للمراجعة");

  await prisma.task.update({ where: { id: taskId }, data: { status: "AWAITING_REVIEW", progressPercent: 100 } });

  await logActivity({ organizationId: task.developmentPlan.organizationId, actorId: user.id, action: "TASK_SUBMITTED_FOR_REVIEW", entityType: "Task", entityId: taskId });

  const consultant = task.developmentPlan.organization.consultant;
  if (consultant) {
    await notifyUser({
      userId: consultant.userId,
      type: "TASK_AWAITING_REVIEW",
      title: `مهمة "${task.title}" بانتظار المراجعة`,
      body: task.developmentPlan.organization.name,
      link: `/consultant/tasks/${taskId}`,
    });
  }

  revalidatePath(`/org/tasks/${taskId}`);
  revalidatePath("/org/plan");
}

export async function recordTaskDelayAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const taskId = String(formData.get("taskId"));
  const reasonCode = String(formData.get("reasonCode"));
  const explanation = String(formData.get("explanation") ?? "");
  const task = await loadTaskWithAccess(taskId, user.id, "ORG");

  await prisma.taskDelay.create({ data: { taskId, reasonCode, explanation } });
  await logActivity({ organizationId: task.developmentPlan.organizationId, actorId: user.id, action: "TASK_DELAY_REASON_ADDED", entityType: "Task", entityId: taskId, metadata: { reasonCode } });

  revalidatePath(`/org/tasks/${taskId}`);
}

export async function reviewTaskAction(formData: FormData) {
  const user = await requireUser(["CONSULTANT"]);
  const taskId = String(formData.get("taskId"));
  const decision = String(formData.get("decision")); // APPROVED | NEEDS_REVISION
  const note = String(formData.get("note") ?? "") || null;
  const task = await loadTaskWithAccess(taskId, user.id, "CONSULTANT");

  await prisma.taskReview.create({ data: { taskId, reviewerId: user.id, decision, note } });
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: decision === "APPROVED" ? "COMPLETED" : "NEEDS_REVISION",
      consultantNotes: note,
      progressPercent: decision === "APPROVED" ? 100 : task.progressPercent,
    },
  });

  await logActivity({ organizationId: task.developmentPlan.organizationId, actorId: user.id, action: "TASK_REVIEWED", entityType: "Task", entityId: taskId, metadata: { decision } });

  const orgUsers = await prisma.user.findMany({ where: { organizationId: task.developmentPlan.organizationId, role: "ORG" } });
  for (const u of orgUsers) {
    await notifyUser({
      userId: u.id,
      type: decision === "APPROVED" ? "TASK_APPROVED" : "REVISION_REQUESTED",
      title: decision === "APPROVED" ? `تم اعتماد إنجاز مهمة "${task.title}"` : `مطلوب تعديل على مهمة "${task.title}"`,
      body: note ?? undefined,
      link: `/org/tasks/${taskId}`,
    });
  }

  revalidatePath(`/consultant/tasks/${taskId}`);
  revalidatePath(`/consultant/organizations/${task.developmentPlan.organizationId}/plan`);
}

export async function addTaskCommentAction(formData: FormData) {
  const user = await requireUser(["ORG", "CONSULTANT"]);
  const taskId = String(formData.get("taskId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  if (user.role === "ORG") await loadTaskWithAccess(taskId, user.id, "ORG");
  else await loadTaskWithAccess(taskId, user.id, "CONSULTANT");

  await prisma.taskComment.create({ data: { taskId, authorId: user.id, body } });

  revalidatePath(`/org/tasks/${taskId}`);
  revalidatePath(`/consultant/tasks/${taskId}`);
}
