"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { logActivity, notifyUser } from "@/lib/activity";
import { runAssessmentAnalysis } from "@/lib/ai/assessment-engine";

async function assertOwnsCycle(userOrgId: string | null, cycleId: string) {
  const cycle = await prisma.assessmentCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (cycle.organizationId !== userOrgId) throw new Error("غير مصرح لك بالوصول لهذا التقييم");
  return cycle;
}

export async function saveAnswerAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const cycleId = String(formData.get("cycleId"));
  const indicatorId = String(formData.get("indicatorId"));
  const answerText = String(formData.get("answerText") ?? "");

  const cycle = await assertOwnsCycle(user.organizationId, cycleId);
  if (cycle.status !== "DRAFT" && cycle.status !== "NEEDS_MORE_INFO") {
    throw new Error("لا يمكن تعديل الإجابات بعد إرسال التقييم");
  }

  await prisma.assessmentResponse.upsert({
    where: { assessmentCycleId_indicatorId: { assessmentCycleId: cycleId, indicatorId } },
    update: { answerText },
    create: { assessmentCycleId: cycleId, indicatorId, answerText },
  });

  revalidatePath(`/org/assessment/${cycle.phase.toLowerCase()}`);
}

export async function uploadEvidenceAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const cycleId = String(formData.get("cycleId"));
  const indicatorId = String(formData.get("indicatorId"));
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const file = formData.get("file") as File | null;

  const cycle = await assertOwnsCycle(user.organizationId, cycleId);
  if (cycle.status !== "DRAFT" && cycle.status !== "NEEDS_MORE_INFO") {
    throw new Error("لا يمكن رفع شواهد بعد إرسال التقييم");
  }

  if (file && file.size > 0) {
    const saved = await saveUploadedFile(file);
    await prisma.assessmentEvidence.create({
      data: {
        assessmentCycleId: cycleId,
        indicatorId,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        uploadedById: user.id,
      },
    });
  } else if (linkUrl) {
    await prisma.assessmentEvidence.create({
      data: {
        assessmentCycleId: cycleId,
        indicatorId,
        fileName: linkUrl,
        linkUrl,
        fileType: "link",
        uploadedById: user.id,
      },
    });
  } else {
    throw new Error("يرجى إرفاق ملف أو رابط");
  }

  revalidatePath(`/org/assessment/${cycle.phase.toLowerCase()}`);
}

export async function deleteEvidenceAction(evidenceId: string) {
  const user = await requireUser(["ORG"]);
  const evidence = await prisma.assessmentEvidence.findUniqueOrThrow({ where: { id: evidenceId }, include: { assessmentCycle: true } });
  if (evidence.assessmentCycle.organizationId !== user.organizationId) throw new Error("غير مصرح");
  if (evidence.assessmentCycle.status !== "DRAFT" && evidence.assessmentCycle.status !== "NEEDS_MORE_INFO") {
    throw new Error("لا يمكن حذف الشواهد بعد إرسال التقييم");
  }
  await prisma.assessmentEvidence.delete({ where: { id: evidenceId } });
  revalidatePath(`/org/assessment/${evidence.assessmentCycle.phase.toLowerCase()}`);
}

export async function submitAssessmentAction(cycleId: string) {
  const user = await requireUser(["ORG"]);
  const cycle = await assertOwnsCycle(user.organizationId, cycleId);
  if (cycle.status !== "DRAFT" && cycle.status !== "NEEDS_MORE_INFO") {
    throw new Error("تم إرسال هذا التقييم مسبقًا");
  }

  await prisma.assessmentCycle.update({ where: { id: cycleId }, data: { status: "SUBMITTED", submittedAt: new Date() } });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "ASSESSMENT_SUBMITTED",
    entityType: "AssessmentCycle",
    entityId: cycleId,
    metadata: { phase: cycle.phase },
  });

  // Run AI analysis synchronously (MVP). A queue/worker can replace this later
  // for larger frameworks without changing the workflow semantics.
  await runAssessmentAnalysis(cycleId);

  revalidatePath(`/org/assessment/${cycle.phase.toLowerCase()}`);
  revalidatePath("/org");
  return { ok: true };
}
