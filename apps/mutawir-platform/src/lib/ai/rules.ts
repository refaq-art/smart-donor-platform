// Deterministic rules layer of the Hybrid Assessment Engine.
// This layer is authoritative: no AI output may exceed the ceilings computed
// here. It never invents evidence — it only reasons about what was actually
// uploaded/answered.

import type { AssessmentIndicator, AssessmentEvidence, IndicatorLevel, RequiredEvidence } from "@prisma/client";

// Keywords that, when present in a maturity indicator's top-tier ("تميز")
// description, mean that tier legally requires certified/approved/documented
// evidence — matching the user's explicit rule: "دليل إجرائي معتمد" must not
// be granted without an actual uploaded document.
const CERTIFIED_EVIDENCE_KEYWORDS = ["معتمد", "موثق", "دليل إجرائي", "شهادة", "وثيقة"];

export type IndicatorWithLevels = AssessmentIndicator & { levels: IndicatorLevel[]; requiredEvidence: RequiredEvidence[] };

export type EvidenceGate = {
  hasEvidence: boolean;
  hasSubstantiveText: boolean;
  requiresCertifiedEvidence: boolean;
  ceilingScore: number; // hard cap the AI/consultant proposal may not exceed for auto-approval
  ceilingLevelLabel: string;
  insufficientInfo: boolean;
  missingEvidenceNames: string[];
};

export function textIsSubstantive(text: string | undefined | null) {
  return Boolean(text && text.trim().length >= 20);
}

export function evaluateEvidenceGate(
  indicator: IndicatorWithLevels,
  answerText: string | undefined,
  evidence: AssessmentEvidence[]
): EvidenceGate {
  const hasEvidence = evidence.length > 0;
  const hasSubstantiveText = textIsSubstantive(answerText);
  const sortedLevels = [...indicator.levels].sort((a, b) => a.levelNumber - b.levelNumber);
  const topLevel = sortedLevels[sortedLevels.length - 1];
  const midLevel = sortedLevels[Math.floor(sortedLevels.length / 2)];
  const bottomLevel = sortedLevels[0];

  if (indicator.type === "COMPLETION_STAGE") {
    const mandatoryEvidence = indicator.requiredEvidence.filter((e) => e.isMandatory);
    const missingEvidenceNames = hasEvidence ? [] : mandatoryEvidence.map((e) => e.name);

    if (!hasEvidence && !hasSubstantiveText) {
      return {
        hasEvidence,
        hasSubstantiveText,
        requiresCertifiedEvidence: true,
        ceilingScore: bottomLevel?.maxScore ?? 1,
        ceilingLevelLabel: bottomLevel?.label ?? "لم يبدأ",
        insufficientInfo: true,
        missingEvidenceNames,
      };
    }
    if (!hasEvidence) {
      // org claims progress in text but no evidence yet — cap mid-stage
      return {
        hasEvidence,
        hasSubstantiveText,
        requiresCertifiedEvidence: true,
        ceilingScore: midLevel?.maxScore ?? 3,
        ceilingLevelLabel: midLevel?.label ?? "قيد التنفيذ",
        insufficientInfo: false,
        missingEvidenceNames,
      };
    }
    return {
      hasEvidence,
      hasSubstantiveText,
      requiresCertifiedEvidence: true,
      ceilingScore: topLevel?.maxScore ?? 5,
      ceilingLevelLabel: topLevel?.label ?? "مكتمل",
      insufficientInfo: false,
      missingEvidenceNames: [],
    };
  }

  // MATURITY_LEVEL
  const requiresCertifiedEvidence = CERTIFIED_EVIDENCE_KEYWORDS.some((k) => topLevel?.description.includes(k));

  if (!hasEvidence && !hasSubstantiveText) {
    return {
      hasEvidence,
      hasSubstantiveText,
      requiresCertifiedEvidence,
      ceilingScore: bottomLevel?.maxScore ?? 1.99,
      ceilingLevelLabel: bottomLevel?.label ?? "مستوى التأسيس",
      insufficientInfo: true,
      missingEvidenceNames: requiresCertifiedEvidence ? ["دليل/وثيقة معتمدة تدعم الإجابة"] : [],
    };
  }

  if (requiresCertifiedEvidence && !hasEvidence) {
    // Text alone cannot justify the top ("تميز") tier when it explicitly
    // requires certified/approved documentation.
    return {
      hasEvidence,
      hasSubstantiveText,
      requiresCertifiedEvidence,
      ceilingScore: midLevel?.maxScore ?? 3.49,
      ceilingLevelLabel: midLevel?.label ?? "مستوى الممارسة",
      insufficientInfo: false,
      missingEvidenceNames: ["دليل/وثيقة معتمدة تثبت المستوى الأعلى"],
    };
  }

  return {
    hasEvidence,
    hasSubstantiveText,
    requiresCertifiedEvidence,
    ceilingScore: topLevel?.maxScore ?? 5,
    ceilingLevelLabel: topLevel?.label ?? "مستوى التميز",
    insufficientInfo: false,
    missingEvidenceNames: [],
  };
}

export function levelLabelForScore(indicator: { levels: IndicatorLevel[] }, score: number) {
  const sorted = [...indicator.levels].sort((a, b) => a.levelNumber - b.levelNumber);
  const level = sorted.find((l) => score >= l.minScore && score <= l.maxScore);
  return level?.label ?? sorted[0]?.label ?? "";
}

export function textQualityScore(text: string | undefined | null) {
  const len = (text ?? "").trim().length;
  if (len >= 80) return 1;
  if (len >= 40) return 0.7;
  if (len >= 10) return 0.4;
  return 0.1;
}

export function blendConfidence(params: { evidenceCompleteness: number; textQuality: number; aiSelfConfidence: number }) {
  const { evidenceCompleteness, textQuality, aiSelfConfidence } = params;
  const value = 0.4 * evidenceCompleteness + 0.25 * textQuality + 0.35 * aiSelfConfidence;
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}
