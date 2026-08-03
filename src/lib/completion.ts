export type ApplicationLike = {
  executiveSummary?: string | null;
  orgIntroduction?: string | null;
  problemStatement?: string | null;
  justification?: string | null;
  objectives?: string | null;
  beneficiaries?: string | null;
  implementationPlan?: string | null;
  activities?: string | null;
  outputs?: string | null;
  outcomes?: string | null;
  kpis?: string | null;
  riskManagement?: string | null;
  sustainability?: string | null;
  timeline?: string | null;
  budget?: string | null;
  donorRequirements?: string | null;
  opportunityId?: string | null;
};

export const APPLICATION_SECTIONS: { key: keyof ApplicationLike; label: string }[] = [
  { key: "executiveSummary", label: "الملخص التنفيذي" },
  { key: "orgIntroduction", label: "تعريف الجمعية" },
  { key: "problemStatement", label: "وصف المشكلة" },
  { key: "justification", label: "مبررات المشروع" },
  { key: "objectives", label: "أهداف المشروع" },
  { key: "beneficiaries", label: "الفئة المستفيدة" },
  { key: "implementationPlan", label: "خطة التنفيذ" },
  { key: "activities", label: "الأنشطة" },
  { key: "outputs", label: "المخرجات" },
  { key: "outcomes", label: "النتائج المتوقعة" },
  { key: "kpis", label: "مؤشرات الأداء" },
  { key: "riskManagement", label: "إدارة المخاطر" },
  { key: "sustainability", label: "الاستدامة" },
  { key: "timeline", label: "الجدول الزمني" },
  { key: "budget", label: "الميزانية" },
  { key: "donorRequirements", label: "متطلبات الجهة المانحة" },
];

function isFilled(v?: string | null) {
  if (!v) return false;
  const trimmed = v.trim();
  if (!trimmed) return false;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.length > 0;
  } catch {
    // ليست JSON، نص عادي
  }
  return true;
}

export function computeCompletion(app: ApplicationLike) {
  const missing: string[] = [];
  let filled = 0;
  for (const section of APPLICATION_SECTIONS) {
    if (isFilled(app[section.key] as string | null | undefined)) {
      filled += 1;
    } else {
      missing.push(section.label);
    }
  }
  if (!app.opportunityId) missing.push("ربط الطلب بفرصة تمويل");
  const percent = Math.round((filled / APPLICATION_SECTIONS.length) * 100);
  return { percent, missing, filled, total: APPLICATION_SECTIONS.length };
}
