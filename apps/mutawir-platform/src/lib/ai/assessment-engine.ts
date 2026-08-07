import { prisma } from "@/lib/prisma";
import { evaluateEvidenceGate, levelLabelForScore, textQualityScore, blendConfidence, textIsSubstantive } from "@/lib/ai/rules";
import { isAIConfigured, runAIAssessmentBatch, type AIIndicatorInput, type AIIndicatorOutput } from "@/lib/ai/client";
import { logActivity, notifyUser } from "@/lib/activity";

/**
 * Hybrid Assessment Engine.
 *
 * The rules layer (src/lib/ai/rules.ts) is authoritative and always runs: it
 * computes an evidence-based ceiling per indicator that no proposed score may
 * exceed. When ANTHROPIC_API_KEY is configured, Claude analyzes the answer
 * text + evidence list and proposes a score/rationale within that ceiling.
 * When it is not configured, a deterministic evidence-completeness heuristic
 * produces the same shape of output so the workflow keeps working end to end
 * — it is clearly labeled as such in the rationale, never presented as an AI
 * judgement it isn't.
 */
export async function runAssessmentAnalysis(assessmentCycleId: string) {
  const cycle = await prisma.assessmentCycle.findUniqueOrThrow({
    where: { id: assessmentCycleId },
    include: { organization: true },
  });

  await prisma.assessmentCycle.update({ where: { id: cycle.id }, data: { status: "AI_ANALYSIS" } });

  const indicators = await prisma.assessmentIndicator.findMany({
    where: { isActive: true },
    include: {
      levels: true,
      requiredEvidence: true,
      criterion: { include: { domain: true } },
    },
    orderBy: [{ criterion: { domain: { order: "asc" } } }, { order: "asc" }],
  });

  const responses = await prisma.assessmentResponse.findMany({ where: { assessmentCycleId } });
  const responseByIndicator = new Map(responses.map((r) => [r.indicatorId, r]));
  const evidenceRows = await prisma.assessmentEvidence.findMany({ where: { assessmentCycleId } });
  const evidenceByIndicator = new Map<string, typeof evidenceRows>();
  for (const e of evidenceRows) {
    const list = evidenceByIndicator.get(e.indicatorId) ?? [];
    list.push(e);
    evidenceByIndicator.set(e.indicatorId, list);
  }

  const aiConfigured = isAIConfigured();
  let aiOutputs = new Map<string, AIIndicatorOutput>();

  if (aiConfigured) {
    const batchInput: AIIndicatorInput[] = indicators.map((ind) => ({
      indicatorCode: ind.code,
      domainName: ind.criterion.domain.name,
      criterionName: ind.criterion.name,
      indicatorName: ind.name,
      indicatorType: ind.type as "MATURITY_LEVEL" | "COMPLETION_STAGE",
      levelDescriptions: [...ind.levels]
        .sort((a, b) => a.levelNumber - b.levelNumber)
        .map((l) => ({ label: l.label, description: l.description })),
      requiredEvidenceHint: ind.requiredEvidenceHint,
      answerText: responseByIndicator.get(ind.id)?.answerText ?? "",
      evidenceNames: (evidenceByIndicator.get(ind.id) ?? []).map((e) => e.fileName),
    }));

    try {
      // Anthropic batches are chunked to stay within tool-output limits.
      const chunkSize = 12;
      for (let i = 0; i < batchInput.length; i += chunkSize) {
        const chunk = batchInput.slice(i, i + chunkSize);
        const results = await runAIAssessmentBatch(cycle.organization.name, cycle.phase as "PRE" | "POST", chunk);
        for (const r of results) aiOutputs.set(r.indicatorCode, r);
      }
    } catch (err) {
      console.error("AI assessment call failed, falling back to rules-only heuristic:", err);
      aiOutputs = new Map();
    }
  }

  for (const indicator of indicators) {
    const answerText = responseByIndicator.get(indicator.id)?.answerText ?? "";
    const evidence = evidenceByIndicator.get(indicator.id) ?? [];
    const gate = evaluateEvidenceGate(indicator, answerText, evidence);
    const ai = aiOutputs.get(indicator.code);

    let insufficientInfo = gate.insufficientInfo;
    let proposedScore: number | null = null;
    let rationale: string;
    let evidenceUsed: string[] = evidence.map((e) => e.fileName);
    let missingEvidence: string[] = gate.missingEvidenceNames;
    let strengths = "";
    let weaknesses = "";
    let gap = "";
    let suggestedNeed = "";
    let aiSelfConfidence = 0;

    if (ai && !gate.insufficientInfo && !ai.insufficientInfo && ai.proposedScore !== null) {
      proposedScore = Math.min(ai.proposedScore, gate.ceilingScore);
      rationale = ai.rationale;
      evidenceUsed = ai.evidenceUsed.length ? ai.evidenceUsed : evidenceUsed;
      missingEvidence = ai.missingEvidence.length ? ai.missingEvidence : missingEvidence;
      strengths = ai.strengths;
      weaknesses = ai.weaknesses;
      gap = ai.gap;
      suggestedNeed = ai.suggestedNeed;
      aiSelfConfidence = ai.aiSelfConfidence;
    } else if (ai && (gate.insufficientInfo || ai.insufficientInfo)) {
      insufficientInfo = true;
      rationale = gate.insufficientInfo
        ? "لا توجد أدلة كافية للحكم — لم يتم إرفاق شواهد ولا توجد إجابة نصية كافية."
        : ai.rationale || "Insufficient Information: لا توجد أدلة كافية للحكم على هذا المؤشر.";
      aiSelfConfidence = ai.aiSelfConfidence ?? 0.1;
    } else if (insufficientInfo) {
      rationale = "لا توجد أدلة كافية للحكم — لم يتم إرفاق شواهد ولا توجد إجابة نصية كافية (Needs Evidence).";
    } else {
      // Rules-only fallback (no AI configured, or AI call failed)
      proposedScore = gate.ceilingScore;
      rationale = gate.requiresCertifiedEvidence && !gate.hasEvidence
        ? `تقييم مبدئي وفق قواعد اكتمال الأدلة فقط (بدون تحليل AI): تم تحديد السقف عند "${gate.ceilingLevelLabel}" لعدم توفر شاهد معتمد يثبت المستوى الأعلى.`
        : `تقييم مبدئي وفق قواعد اكتمال الأدلة فقط (بدون تحليل AI): الشواهد والإجابة المتوفرة تدعم مستوى "${gate.ceilingLevelLabel}".`;
      missingEvidence = gate.missingEvidenceNames;
      gap = gate.missingEvidenceNames.length ? `يلزم استكمال: ${gate.missingEvidenceNames.join("، ")}` : "";
      aiSelfConfidence = 0.4;
    }

    const evidenceCompleteness = indicator.requiredEvidence.length > 0 ? (evidence.length > 0 ? 1 : 0) : gate.hasEvidence ? 1 : 0.5;
    const confidence = insufficientInfo
      ? Math.min(0.2, blendConfidence({ evidenceCompleteness, textQuality: textQualityScore(answerText), aiSelfConfidence }))
      : blendConfidence({ evidenceCompleteness, textQuality: textQualityScore(answerText), aiSelfConfidence });

    const proposedLevel = proposedScore !== null ? levelLabelForScore(indicator, proposedScore) : null;

    await prisma.aIAssessment.create({
      data: {
        assessmentCycleId,
        indicatorId: indicator.id,
        proposedScore,
        proposedLevel,
        confidence,
        rationale,
        evidenceUsed: JSON.stringify(evidenceUsed),
        missingEvidence: JSON.stringify(missingEvidence),
        insufficientInfo,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        gap: gap || null,
        suggestedNeed: suggestedNeed || null,
      },
    });
  }

  await prisma.assessmentCycle.update({
    where: { id: cycle.id },
    data: { status: "AWAITING_CONSULTANT_REVIEW", aiAnalysisCompletedAt: new Date() },
  });

  await logActivity({
    organizationId: cycle.organizationId,
    action: "AI_ANALYSIS_COMPLETED",
    entityType: "AssessmentCycle",
    entityId: cycle.id,
    metadata: { phase: cycle.phase, aiConfigured },
  });

  const org = await prisma.organization.findUnique({ where: { id: cycle.organizationId }, include: { consultant: { include: { user: true } } } });
  if (org?.consultant?.user) {
    await notifyUser({
      userId: org.consultant.user.id,
      type: "AWAITING_ASSESSMENT_APPROVAL",
      title: `جمعية ${org.name} بانتظار اعتماد التقييم`,
      body: `أنهى الذكاء الاصطناعي تحليل ${cycle.phase === "PRE" ? "التقييم القبلي" : "التقييم البعدي"} وينتظر اعتمادك.`,
      link: `/consultant/assessments/${cycle.id}`,
    });
  }

  return { indicatorCount: indicators.length, aiConfigured };
}
