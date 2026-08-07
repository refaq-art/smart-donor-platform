"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, notifyUser } from "@/lib/activity";
import { levelLabelForScore } from "@/lib/ai/rules";

async function assertConsultantOwnsCycle(consultantUserId: string, cycleId: string) {
  const cycle = await prisma.assessmentCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: { organization: { include: { consultant: true } } },
  });
  if (cycle.organization.consultant?.userId !== consultantUserId) throw new Error("غير مصرح لك بمراجعة هذا التقييم");
  return cycle;
}

export async function decideIndicatorAction(formData: FormData) {
  const user = await requireUser(["CONSULTANT"]);
  const cycleId = String(formData.get("cycleId"));
  const indicatorId = String(formData.get("indicatorId"));
  const decision = String(formData.get("decision")); // APPROVED_AI | MODIFIED
  const finalScoreRaw = String(formData.get("finalScore") ?? "");
  const changeReason = String(formData.get("changeReason") ?? "").trim() || null;
  const gapNote = String(formData.get("gapNote") ?? "").trim() || null;

  const cycle = await assertConsultantOwnsCycle(user.id, cycleId);
  const indicator = await prisma.assessmentIndicator.findUniqueOrThrow({ where: { id: indicatorId }, include: { levels: true } });
  const aiAssessment = await prisma.aIAssessment.findFirst({
    where: { assessmentCycleId: cycleId, indicatorId },
    orderBy: { createdAt: "desc" },
  });

  const finalScore = Number(finalScoreRaw);
  if (Number.isNaN(finalScore)) throw new Error("يرجى إدخال درجة صحيحة");
  if (decision === "MODIFIED" && !changeReason) throw new Error("يرجى كتابة سبب التعديل");

  const finalLevel = levelLabelForScore(indicator, finalScore);

  await prisma.consultantAssessment.upsert({
    where: { assessmentCycleId_indicatorId: { assessmentCycleId: cycleId, indicatorId } },
    update: { finalScore, finalLevel, decision, changeReason, gapNote, consultantId: user.id, aiAssessmentId: aiAssessment?.id, decidedAt: new Date() },
    create: {
      assessmentCycleId: cycleId,
      indicatorId,
      finalScore,
      finalLevel,
      decision,
      changeReason,
      gapNote,
      consultantId: user.id,
      aiAssessmentId: aiAssessment?.id,
    },
  });

  await logActivity({
    organizationId: cycle.organizationId,
    actorId: user.id,
    action: decision === "MODIFIED" ? "CONSULTANT_MODIFIED_SCORE" : "CONSULTANT_APPROVED_AI_SCORE",
    entityType: "AssessmentIndicator",
    entityId: indicatorId,
    metadata: { finalScore, aiScore: aiAssessment?.proposedScore ?? null, changeReason },
  });

  revalidatePath(`/consultant/assessments/${cycleId}`);
}

export async function requestMoreInfoAction(cycleId: string) {
  const user = await requireUser(["CONSULTANT"]);
  const cycle = await assertConsultantOwnsCycle(user.id, cycleId);
  await prisma.assessmentCycle.update({ where: { id: cycleId }, data: { status: "NEEDS_MORE_INFO" } });

  await logActivity({ organizationId: cycle.organizationId, actorId: user.id, action: "REQUESTED_MORE_INFO", entityType: "AssessmentCycle", entityId: cycleId });

  const orgUsers = await prisma.user.findMany({ where: { organizationId: cycle.organizationId, role: "ORG" } });
  for (const u of orgUsers) {
    await notifyUser({
      userId: u.id,
      type: "EVIDENCE_REQUESTED",
      title: "المستشار طلب معلومات/شواهد إضافية",
      body: "راجع ملاحظات المستشار على التقييم واستكمل الشواهد المطلوبة.",
      link: `/org/assessment/${cycle.phase.toLowerCase()}`,
    });
  }

  revalidatePath(`/consultant/assessments/${cycleId}`);
}

export async function approveAssessmentAction(cycleId: string) {
  const user = await requireUser(["CONSULTANT"]);
  const cycle = await assertConsultantOwnsCycle(user.id, cycleId);

  const indicatorCount = await prisma.assessmentIndicator.count({ where: { isActive: true } });
  const decisions = await prisma.consultantAssessment.findMany({ where: { assessmentCycleId: cycleId } });
  if (decisions.length < indicatorCount) {
    throw new Error(`لا يزال هناك ${indicatorCount - decisions.length} مؤشر بدون قرار من المستشار`);
  }

  const overallScore = decisions.reduce((sum, d) => sum + d.finalScore, 0) / decisions.length;

  await prisma.assessmentCycle.update({
    where: { id: cycleId },
    data: { status: "APPROVED", consultantApprovedAt: new Date(), consultantApprovedById: user.id, overallScore },
  });

  if (cycle.phase === "PRE") {
    await prisma.organization.update({ where: { id: cycle.organizationId }, data: { programStartDate: new Date() } });

    // Build development gaps for indicators below the top tier.
    const indicators = await prisma.assessmentIndicator.findMany({ where: { isActive: true }, include: { levels: true } });
    const indicatorMap = new Map(indicators.map((i) => [i.id, i]));
    for (const decision of decisions) {
      const indicator = indicatorMap.get(decision.indicatorId);
      if (!indicator) continue;
      const topLevel = [...indicator.levels].sort((a, b) => b.levelNumber - a.levelNumber)[0];
      if (!topLevel || decision.finalScore >= topLevel.minScore) continue; // already at top tier

      await prisma.developmentGap.upsert({
        where: { organizationId_indicatorId: { organizationId: cycle.organizationId, indicatorId: indicator.id } },
        update: {
          approvedScore: decision.finalScore,
          currentLevel: decision.finalLevel,
          targetLevel: topLevel.label,
          gapDescription: decision.gapNote || `الفجوة بين المستوى الحالي (${decision.finalLevel}) والمستوى المستهدف (${topLevel.label})`,
        },
        create: {
          organizationId: cycle.organizationId,
          indicatorId: indicator.id,
          approvedScore: decision.finalScore,
          currentLevel: decision.finalLevel,
          targetLevel: topLevel.label,
          gapDescription: decision.gapNote || `الفجوة بين المستوى الحالي (${decision.finalLevel}) والمستوى المستهدف (${topLevel.label})`,
          developmentNeed: "",
          priority: decision.finalScore <= (indicator.levels[0]?.maxScore ?? 2) ? "HIGH" : "MEDIUM",
        },
      });
    }
  }

  await logActivity({ organizationId: cycle.organizationId, actorId: user.id, action: "ASSESSMENT_APPROVED", entityType: "AssessmentCycle", entityId: cycleId, metadata: { overallScore, phase: cycle.phase } });

  const orgUsers = await prisma.user.findMany({ where: { organizationId: cycle.organizationId, role: "ORG" } });
  for (const u of orgUsers) {
    await notifyUser({
      userId: u.id,
      type: "TASK_APPROVED",
      title: `تم اعتماد ${cycle.phase === "PRE" ? "التقييم القبلي" : "التقييم البعدي"}`,
      body: `النتيجة المعتمدة: ${overallScore.toFixed(2)} / 5`,
      link: "/org",
    });
  }

  revalidatePath(`/consultant/assessments/${cycleId}`);
  revalidatePath("/consultant");
  revalidatePath("/org");
}
