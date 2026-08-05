// بيانات صرفة لحقول محتوى طلب المنحة — مشتركة بين محرر الطلب ولوحة التعليقات ومقارنة الإصدارات.

export type Fields = {
  executiveSummary: string;
  orgIntroduction: string;
  problemStatement: string;
  justification: string;
  objectives: string;
  beneficiaries: string;
  implementationPlan: string;
  activities: string;
  outputs: string;
  outcomes: string;
  kpis: string;
  riskManagement: string;
  sustainability: string;
  timeline: string;
  budget: string;
  donorRequirements: string;
};

export const FIELD_KEYS = [
  "executiveSummary",
  "orgIntroduction",
  "problemStatement",
  "justification",
  "objectives",
  "beneficiaries",
  "implementationPlan",
  "activities",
  "outputs",
  "outcomes",
  "kpis",
  "riskManagement",
  "sustainability",
  "timeline",
  "budget",
  "donorRequirements",
] as const satisfies readonly (keyof Fields)[];

export const FIELD_LABELS: Record<keyof Fields, string> = {
  executiveSummary: "الملخص التنفيذي",
  orgIntroduction: "تعريف الجمعية",
  problemStatement: "وصف المشكلة",
  justification: "مبررات المشروع",
  objectives: "أهداف المشروع",
  beneficiaries: "الفئة المستفيدة",
  implementationPlan: "خطة التنفيذ",
  activities: "الأنشطة",
  outputs: "المخرجات",
  outcomes: "النتائج المتوقعة",
  kpis: "مؤشرات الأداء",
  riskManagement: "إدارة المخاطر",
  sustainability: "الاستدامة",
  timeline: "الجدول الزمني",
  budget: "الميزانية",
  donorRequirements: "متطلبات الجهة المانحة",
};

export const FIELD_PLACEHOLDERS: Partial<Record<keyof Fields, string>> = {
  executiveSummary: "فقرة تلخص المشروع والحاجة والهدف والفئة المستفيدة والتمويل المطلوب",
  orgIntroduction: "نبذة عن الجمعية وخبرتها وسجلها في تنفيذ المشاريع المماثلة",
  problemStatement: "وصف دقيق وموثق للمشكلة أو الاحتياج",
  justification: "لماذا هذا المشروع تحديدًا؟ ولماذا الآن؟",
  objectives: "الأهداف العامة والتفصيلية القابلة للقياس",
  beneficiaries: "من هم المستفيدون؟ عددهم وخصائصهم؟",
  implementationPlan: "آلية التنفيذ العامة ومراحل المشروع",
  activities: "الأنشطة التفصيلية المخطط تنفيذها",
  outputs: "المخرجات المباشرة القابلة للعدّ",
  outcomes: "النتائج المتوقعة على مستوى الأثر",
  kpis: "مؤشرات قياس الأداء وطريقة القياس",
  riskManagement: "المخاطر المحتملة وخطط التخفيف منها",
  sustainability: "كيف سيستمر الأثر بعد انتهاء التمويل؟",
  timeline: "الجدول الزمني لمراحل التنفيذ",
  budget: "تفاصيل الميزانية موزعة على البنود",
  donorRequirements: "أي متطلبات أو مستندات خاصة تطلبها الجهة المانحة",
};

export const TABS: { id: string; label: string; fields: (keyof Fields)[] }[] = [
  { id: "summary", label: "الملخص والتعريف", fields: ["executiveSummary", "orgIntroduction"] },
  { id: "problem", label: "المشكلة والمبررات", fields: ["problemStatement", "justification"] },
  { id: "goals", label: "الأهداف والمستفيدون", fields: ["objectives", "beneficiaries"] },
  { id: "plan", label: "خطة التنفيذ", fields: ["implementationPlan", "activities", "outputs", "outcomes", "kpis"] },
  { id: "risk", label: "المخاطر والاستدامة", fields: ["riskManagement", "sustainability"] },
  { id: "budget", label: "الجدول والميزانية", fields: ["timeline", "budget"] },
  { id: "donor", label: "متطلبات الجهة المانحة", fields: ["donorRequirements"] },
];
