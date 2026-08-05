/**
 * محرك أهلية المنح.
 *
 * يقيّم شروط فرصة تمويل مقابل بيانات الجمعية والمشروع، وينتج حكمًا مع **سبب
 * لكل شرط** — لا تُعطى نتيجة أو درجة توافق دون تفسير.
 *
 * القواعد تُضاف وتُعدَّل من الواجهة (جدول EligibilityCriterion) دون تعديل الكود؛
 * هذا الملف يوفّر المفاتيح القابلة للتقييم الآلي فقط.
 */

export type Verdict = "ELIGIBLE" | "CONDITIONAL" | "NOT_ELIGIBLE" | "INSUFFICIENT_DATA";

export const VERDICT_LABELS: Record<Verdict, string> = {
  ELIGIBLE: "مؤهل",
  CONDITIONAL: "مؤهل بشروط",
  NOT_ELIGIBLE: "غير مؤهل",
  INSUFFICIENT_DATA: "معلومات غير كافية",
};

export const VERDICT_COLORS: Record<Verdict, string> = {
  ELIGIBLE: "bg-emerald-50 text-emerald-700 border-emerald-300",
  CONDITIONAL: "bg-amber-50 text-amber-700 border-amber-300",
  NOT_ELIGIBLE: "bg-red-50 text-red-700 border-red-300",
  INSUFFICIENT_DATA: "bg-slate-100 text-slate-600 border-slate-300",
};

/** مفاتيح الشروط القابلة للتقييم الآلي، مع وصف عربي لعرضها في الواجهة. */
export const RULE_KEYS = {
  ORG_AGE_YEARS: "عمر الجمعية (بالسنوات)",
  ORG_SECTOR: "مجال عمل الجمعية",
  ORG_GEOGRAPHIC_SCOPE: "النطاق الجغرافي للجمعية",
  ORG_HAS_VALID_LICENSE: "ترخيص الجمعية ساري المفعول",
  PROJECT_CATEGORY: "مجال المشروع",
  BENEFICIARY_COUNT: "عدد المستفيدين",
  PROJECT_BUDGET: "قيمة المشروع (ر.س)",
  SELF_CONTRIBUTION_PCT: "نسبة المساهمة الذاتية (%)",
  ADMIN_COST_PCT: "نسبة التكاليف الإدارية (%)",
  HAS_DOCUMENT: "توفر مستند بتصنيف محدد وساري",
  PROJECT_HAS_KPIS: "وجود مؤشرات أداء للمشروع",
  PROJECT_HAS_TIMELINE: "وجود جدول زمني للمشروع",
  MANUAL: "تحقق يدوي (يؤكده المستخدم)",
} as const;

export type RuleKey = keyof typeof RULE_KEYS;

export const OPERATORS = {
  GTE: "أكبر من أو يساوي",
  LTE: "أصغر من أو يساوي",
  EQ: "يساوي",
  IN: "ضمن القائمة",
  EXISTS: "موجود",
  BOOLEAN: "نعم/لا",
} as const;

export type Operator = keyof typeof OPERATORS;

export type Criterion = {
  id: string;
  ruleKey: string;
  label: string;
  operator: string;
  value: string | null;
  documentCategory: string | null;
  isMandatory: boolean;
  notes: string | null;
};

export type EvaluationContext = {
  org: {
    foundedAt?: Date | string | null;
    sector?: string | null;
    geographicScope?: string | null;
    licenseExpiry?: Date | string | null;
  };
  project?: {
    category?: string | null;
    beneficiaryCount?: number | null;
    budgetTotal?: number | null;
    kpis?: string | null;
    timelineStart?: Date | string | null;
    timelineEnd?: Date | string | null;
  } | null;
  /** تصنيفات المستندات السارية المتوفرة لدى الجمعية */
  validDocumentCategories: string[];
};

export type CriterionResult = {
  criterionId: string;
  label: string;
  /** PASS = مستوفى | FAIL = غير مستوفى | UNKNOWN = بيانات ناقصة */
  status: "PASS" | "FAIL" | "UNKNOWN";
  isMandatory: boolean;
  /** شرح بلغة واضحة لسبب هذه النتيجة تحديدًا */
  reason: string;
  /** ما الذي يحتاجه المستخدم لإصلاح الوضع أو استكمال البيانات */
  actionNeeded?: string;
};

export type EligibilityResult = {
  verdict: Verdict;
  /** ملخص نصي يشرح سبب الحكم العام */
  summary: string;
  results: CriterionResult[];
  passed: number;
  failed: number;
  unknown: number;
};

function yearsSince(d?: Date | string | null): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function parseList(v?: string | null): string[] {
  if (!v) return [];
  return v
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function compareNumber(
  actual: number | null | undefined,
  operator: string,
  expected: number
): "PASS" | "FAIL" | "UNKNOWN" {
  if (actual === null || actual === undefined || Number.isNaN(actual)) return "UNKNOWN";
  switch (operator) {
    case "GTE":
      return actual >= expected ? "PASS" : "FAIL";
    case "LTE":
      return actual <= expected ? "PASS" : "FAIL";
    case "EQ":
      return actual === expected ? "PASS" : "FAIL";
    default:
      return "UNKNOWN";
  }
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("ar-SA-u-nu-latn").format(n);
}

function evaluateOne(c: Criterion, ctx: EvaluationContext): CriterionResult {
  const base = { criterionId: c.id, label: c.label, isMandatory: c.isMandatory };
  const expectedNum = c.value !== null && c.value !== "" ? Number(c.value) : NaN;

  switch (c.ruleKey) {
    case "ORG_AGE_YEARS": {
      const age = yearsSince(ctx.org.foundedAt);
      if (age === null)
        return {
          ...base,
          status: "UNKNOWN",
          reason: "تاريخ تأسيس الجمعية غير مسجّل في ملف الجمعية.",
          actionNeeded: "أضف تاريخ التأسيس في صفحة ملف الجمعية.",
        };
      const status = compareNumber(age, c.operator, expectedNum);
      return {
        ...base,
        status,
        reason:
          status === "PASS"
            ? `عمر الجمعية ${age.toFixed(1)} سنة، وهو يستوفي الشرط (${OPERATORS[c.operator as Operator] || c.operator} ${c.value}).`
            : `عمر الجمعية ${age.toFixed(1)} سنة، والشرط يتطلب ${OPERATORS[c.operator as Operator] || c.operator} ${c.value} سنة.`,
        actionNeeded: status === "FAIL" ? "هذا الشرط لا يمكن استيفاؤه حاليًا (مرتبط بتاريخ التأسيس)." : undefined,
      };
    }

    case "ORG_SECTOR":
    case "ORG_GEOGRAPHIC_SCOPE": {
      const actual =
        c.ruleKey === "ORG_SECTOR" ? ctx.org.sector : ctx.org.geographicScope;
      const fieldName = c.ruleKey === "ORG_SECTOR" ? "مجال عمل الجمعية" : "النطاق الجغرافي للجمعية";
      if (!actual)
        return {
          ...base,
          status: "UNKNOWN",
          reason: `${fieldName} غير مسجّل في ملف الجمعية.`,
          actionNeeded: `أضف ${fieldName} في صفحة ملف الجمعية.`,
        };
      const accepted = parseList(c.value);
      const matched = accepted.some((a) => actual.includes(a) || a.includes(actual));
      return {
        ...base,
        status: matched ? "PASS" : "FAIL",
        reason: matched
          ? `${fieldName} («${actual}») يتوافق مع المطلوب (${accepted.join("، ")}).`
          : `${fieldName} («${actual}») لا يتطابق مع المطلوب (${accepted.join("، ")}).`,
      };
    }

    case "ORG_HAS_VALID_LICENSE": {
      const exp = ctx.org.licenseExpiry;
      if (!exp)
        return {
          ...base,
          status: "UNKNOWN",
          reason: "تاريخ انتهاء ترخيص الجمعية غير مسجّل.",
          actionNeeded: "أضف تاريخ انتهاء الترخيص في ملف الجمعية.",
        };
      const valid = new Date(exp).getTime() > Date.now();
      return {
        ...base,
        status: valid ? "PASS" : "FAIL",
        reason: valid
          ? "ترخيص الجمعية ساري المفعول."
          : "ترخيص الجمعية منتهي الصلاحية.",
        actionNeeded: valid ? undefined : "جدّد الترخيص وحدّث تاريخه في ملف الجمعية.",
      };
    }

    case "PROJECT_CATEGORY": {
      if (!ctx.project)
        return { ...base, status: "UNKNOWN", reason: "لم يُختَر مشروع بعد.", actionNeeded: "اختر المشروع المراد التقديم به." };
      const actual = ctx.project.category;
      if (!actual)
        return {
          ...base,
          status: "UNKNOWN",
          reason: "فئة المشروع غير محددة.",
          actionNeeded: "حدّد فئة المشروع في صفحة المشروع.",
        };
      const accepted = parseList(c.value);
      const matched = accepted.some((a) => actual.includes(a) || a.includes(actual));
      return {
        ...base,
        status: matched ? "PASS" : "FAIL",
        reason: matched
          ? `مجال المشروع («${actual}») ضمن المجالات المقبولة (${accepted.join("، ")}).`
          : `مجال المشروع («${actual}») خارج المجالات المقبولة (${accepted.join("، ")}).`,
      };
    }

    case "BENEFICIARY_COUNT": {
      if (!ctx.project)
        return { ...base, status: "UNKNOWN", reason: "لم يُختَر مشروع بعد.", actionNeeded: "اختر المشروع أولًا." };
      const actual = ctx.project.beneficiaryCount ?? null;
      const status = compareNumber(actual, c.operator, expectedNum);
      if (status === "UNKNOWN")
        return {
          ...base,
          status,
          reason: "عدد المستفيدين غير مسجّل في المشروع.",
          actionNeeded: "أضف عدد المستفيدين المتوقع في بيانات المشروع.",
        };
      return {
        ...base,
        status,
        reason: `عدد المستفيدين ${fmtNum(actual!)}، والشرط يتطلب ${OPERATORS[c.operator as Operator] || c.operator} ${fmtNum(expectedNum)}.`,
      };
    }

    case "PROJECT_BUDGET": {
      if (!ctx.project)
        return { ...base, status: "UNKNOWN", reason: "لم يُختَر مشروع بعد.", actionNeeded: "اختر المشروع أولًا." };
      const actual = ctx.project.budgetTotal ?? null;
      const status = compareNumber(actual, c.operator, expectedNum);
      if (status === "UNKNOWN")
        return {
          ...base,
          status,
          reason: "ميزانية المشروع غير مسجّلة.",
          actionNeeded: "أضف إجمالي ميزانية المشروع.",
        };
      return {
        ...base,
        status,
        reason: `ميزانية المشروع ${fmtNum(actual!)} ر.س، والشرط يتطلب ${OPERATORS[c.operator as Operator] || c.operator} ${fmtNum(expectedNum)} ر.س.`,
      };
    }

    case "PROJECT_HAS_KPIS": {
      if (!ctx.project)
        return { ...base, status: "UNKNOWN", reason: "لم يُختَر مشروع بعد.", actionNeeded: "اختر المشروع أولًا." };
      let count = 0;
      try {
        const k = JSON.parse(ctx.project.kpis || "[]");
        count = Array.isArray(k) ? k.length : 0;
      } catch {
        count = 0;
      }
      return {
        ...base,
        status: count > 0 ? "PASS" : "FAIL",
        reason: count > 0 ? `المشروع يحتوي على ${count} مؤشر أداء.` : "المشروع لا يحتوي على مؤشرات أداء.",
        actionNeeded: count > 0 ? undefined : "أضف مؤشرات أداء قابلة للقياس في صفحة المشروع.",
      };
    }

    case "PROJECT_HAS_TIMELINE": {
      if (!ctx.project)
        return { ...base, status: "UNKNOWN", reason: "لم يُختَر مشروع بعد.", actionNeeded: "اختر المشروع أولًا." };
      const has = !!(ctx.project.timelineStart && ctx.project.timelineEnd);
      return {
        ...base,
        status: has ? "PASS" : "FAIL",
        reason: has ? "الجدول الزمني للمشروع محدد." : "الجدول الزمني للمشروع غير مكتمل.",
        actionNeeded: has ? undefined : "حدّد تاريخي بداية ونهاية التنفيذ في صفحة المشروع.",
      };
    }

    case "HAS_DOCUMENT": {
      const cat = c.documentCategory;
      if (!cat)
        return { ...base, status: "UNKNOWN", reason: "لم يُحدَّد تصنيف المستند المطلوب في هذا الشرط." };
      const has = ctx.validDocumentCategories.includes(cat);
      return {
        ...base,
        status: has ? "PASS" : "FAIL",
        reason: has
          ? `يوجد مستند ساري بتصنيف «${cat}» في مكتبة المستندات.`
          : `لا يوجد مستند ساري بتصنيف «${cat}» في مكتبة المستندات.`,
        actionNeeded: has ? undefined : `ارفع مستند «${cat}» ساري الصلاحية في ملف الجمعية.`,
      };
    }

    case "SELF_CONTRIBUTION_PCT":
    case "ADMIN_COST_PCT":
    case "MANUAL":
    default:
      // شروط تتطلب إدخالًا أو تأكيدًا يدويًا — لا تُخمَّن آليًا
      return {
        ...base,
        status: "UNKNOWN",
        reason: c.notes
          ? `يتطلب تحققًا يدويًا: ${c.notes}`
          : "هذا الشرط يتطلب تحققًا يدويًا من المستخدم.",
        actionNeeded: "راجع هذا الشرط يدويًا وتأكد من استيفائه قبل التقديم.",
      };
  }
}

export function evaluateEligibility(
  criteria: Criterion[],
  ctx: EvaluationContext
): EligibilityResult {
  const results = criteria.map((c) => evaluateOne(c, ctx));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const unknown = results.filter((r) => r.status === "UNKNOWN").length;

  const mandatoryFailed = results.filter((r) => r.status === "FAIL" && r.isMandatory);
  const mandatoryUnknown = results.filter((r) => r.status === "UNKNOWN" && r.isMandatory);
  const optionalFailed = results.filter((r) => r.status === "FAIL" && !r.isMandatory);

  let verdict: Verdict;
  let summary: string;

  if (criteria.length === 0) {
    verdict = "INSUFFICIENT_DATA";
    summary = "لم تُسجَّل شروط أهلية لهذه الفرصة بعد، فلا يمكن إصدار حكم.";
  } else if (mandatoryFailed.length > 0) {
    verdict = "NOT_ELIGIBLE";
    summary = `غير مؤهل لعدم استيفاء ${mandatoryFailed.length} شرط إلزامي: ${mandatoryFailed
      .map((r) => r.label)
      .join("، ")}.`;
  } else if (mandatoryUnknown.length > 0) {
    verdict = "INSUFFICIENT_DATA";
    summary = `لا يمكن الحكم بعد — ${mandatoryUnknown.length} شرط إلزامي تنقصه بيانات: ${mandatoryUnknown
      .map((r) => r.label)
      .join("، ")}.`;
  } else if (optionalFailed.length > 0 || unknown > 0) {
    verdict = "CONDITIONAL";
    const bits: string[] = [];
    if (optionalFailed.length) bits.push(`${optionalFailed.length} شرط غير إلزامي غير مستوفى`);
    if (unknown) bits.push(`${unknown} شرط يحتاج تحققًا أو بيانات إضافية`);
    summary = `مؤهل بشروط: جميع الشروط الإلزامية مستوفاة، لكن ${bits.join(" و")}.`;
  } else {
    verdict = "ELIGIBLE";
    summary = `مؤهل: جميع الشروط الـ${criteria.length} مستوفاة.`;
  }

  return { verdict, summary, results, passed, failed, unknown };
}
