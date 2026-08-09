// Single source of truth for all "enum-like" string fields.
// SQLite has no native Prisma enum support, so these are validated at the
// application boundary instead of the database layer.

export const ROLES = ["ORG", "CONSULTANT", "COUNCIL", "ADMIN"] as const;
export type RoleValue = (typeof ROLES)[number];

export const ASSESSMENT_PHASES = ["PRE", "POST"] as const;
export type AssessmentPhaseValue = (typeof ASSESSMENT_PHASES)[number];

export const ASSESSMENT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "AI_ANALYSIS",
  "AWAITING_CONSULTANT_REVIEW",
  "NEEDS_MORE_INFO",
  "APPROVED",
] as const;
export type AssessmentStatusValue = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatusValue, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "تم الإرسال",
  AI_ANALYSIS: "تحليل الذكاء الاصطناعي",
  AWAITING_CONSULTANT_REVIEW: "بانتظار اعتماد المستشار",
  NEEDS_MORE_INFO: "يحتاج معلومات إضافية",
  APPROVED: "معتمد",
};

export const INDICATOR_TYPES = ["MATURITY_LEVEL", "COMPLETION_STAGE"] as const;
export type IndicatorTypeValue = (typeof INDICATOR_TYPES)[number];

export const CONSULTANT_DECISIONS = ["APPROVED_AI", "MODIFIED", "NEEDS_MORE_INFO"] as const;
export type ConsultantDecisionValue = (typeof CONSULTANT_DECISIONS)[number];

export const TASK_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "AWAITING_REVIEW",
  "NEEDS_REVISION",
  "COMPLETED",
  "LATE",
] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  NOT_STARTED: "لم تبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  AWAITING_REVIEW: "بانتظار مراجعة المستشار",
  NEEDS_REVISION: "مطلوب تعديل",
  COMPLETED: "مكتملة",
  LATE: "متأخرة",
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  CRITICAL: "حرجة",
};

export const DELAY_REASON_CODES = [
  "AWAITING_APPROVAL",
  "EXTERNAL_PARTY",
  "STAFF_SHORTAGE",
  "FUNDING_SHORTAGE",
  "MISSING_DOCUMENTS",
  "VENDOR_DELAY",
  "IMPLEMENTATION_DIFFICULTY",
  "OTHER",
] as const;
export type DelayReasonCodeValue = (typeof DELAY_REASON_CODES)[number];

export const DELAY_REASON_LABELS: Record<DelayReasonCodeValue, string> = {
  AWAITING_APPROVAL: "انتظار اعتماد",
  EXTERNAL_PARTY: "جهة خارجية",
  STAFF_SHORTAGE: "نقص موظفين",
  FUNDING_SHORTAGE: "نقص مالي",
  MISSING_DOCUMENTS: "نقص وثائق",
  VENDOR_DELAY: "تأخر مورد",
  IMPLEMENTATION_DIFFICULTY: "صعوبة تنفيذ",
  OTHER: "سبب آخر",
};

export const RECOMMENDATION_KINDS = ["DEVELOPMENT_NEED", "TASK", "PRIORITY"] as const;
export type RecommendationKindValue = (typeof RECOMMENDATION_KINDS)[number];

export const RECOMMENDATION_STATUSES = ["PENDING", "ACCEPTED", "EDITED", "DISMISSED"] as const;
export type RecommendationStatusValue = (typeof RECOMMENDATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "DAYS_REMAINING",
  "TASK_LATE",
  "REVISION_REQUESTED",
  "TASK_APPROVED",
  "EVIDENCE_REQUESTED",
  "POST_ASSESSMENT_DUE",
  "NEW_SUBMISSION",
  "AI_ANALYSIS_DONE",
  "AWAITING_ASSESSMENT_APPROVAL",
  "NEW_EVIDENCE",
  "TASK_AWAITING_REVIEW",
  "ORG_INACTIVE_7_DAYS",
] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export type ProgressStatusValue = "AHEAD" | "ON_TRACK" | "NEEDS_ATTENTION" | "LATE" | "VERY_LATE";

export const PROGRESS_STATUS_LABELS: Record<ProgressStatusValue, string> = {
  AHEAD: "متقدم",
  ON_TRACK: "على المسار",
  NEEDS_ATTENTION: "يحتاج انتباه",
  LATE: "متأخر",
  VERY_LATE: "متأخر جدًا",
};

export const PROGRESS_STATUS_COLORS: Record<ProgressStatusValue, string> = {
  AHEAD: "bg-emerald-100 text-emerald-800",
  ON_TRACK: "bg-sky-100 text-sky-800",
  NEEDS_ATTENTION: "bg-amber-100 text-amber-800",
  LATE: "bg-orange-100 text-orange-800",
  VERY_LATE: "bg-red-100 text-red-800",
};
