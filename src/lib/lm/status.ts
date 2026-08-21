import { isZeroOrLess, round2 } from "./money";

export type LmStatus = "UPCOMING" | "DUE_TODAY" | "LATE" | "PARTIAL" | "PAID";

export const STATUS_META: Record<LmStatus, { label: string; badge: string; dot: string }> = {
  UPCOMING: {
    label: "قادم",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  DUE_TODAY: {
    label: "مستحق اليوم",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  LATE: {
    label: "متأخر",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  PARTIAL: {
    label: "مسدد جزئيًا",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  PAID: {
    label: "مسدد",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const STATUS_FILTER_OPTIONS: { value: LmStatus | "ALL" | "UNPAID"; label: string }[] = [
  { value: "ALL", label: "الكل" },
  { value: "UPCOMING", label: "قادم" },
  { value: "DUE_TODAY", label: "مستحق اليوم" },
  { value: "LATE", label: "متأخر" },
  { value: "PARTIAL", label: "مسدد جزئيًا" },
  { value: "PAID", label: "مسدد" },
  { value: "UNPAID", label: "غير مسدد" },
];

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

type InstallmentLike = { amount: number; paidAmount: number; dueDate: Date };

/** يشتق حالة قسط واحد لحظيًا من تاريخ اليوم الفعلي والمبالغ — لا تُخزَّن هذه
 * الحالة أبدًا في قاعدة البيانات لأنها تتغير مع مرور الزمن نفسه دون أي تعديل
 * على البيانات (تخزينها يعني بالضرورة بيانات ستُصبح قديمة). */
export function deriveInstallmentStatus(installment: InstallmentLike, today: Date = new Date()): LmStatus {
  const remaining = round2(installment.amount - installment.paidAmount);
  if (isZeroOrLess(remaining)) return "PAID";

  const due = startOfUtcDay(installment.dueDate);
  const now = startOfUtcDay(today);

  if (due < now) return "LATE";
  if (due === now) return "DUE_TODAY";
  if (installment.paidAmount > 0) return "PARTIAL";
  return "UPCOMING";
}

/** حالة العملية الكلية (مهلة أو أقساط) مشتقة من حالات كل أقساطها:
 * مسددة إذا اكتملت كل الأقساط، متأخرة إذا تأخر أي قسط، مستحقة اليوم إذا
 * استحق أي قسط اليوم دون تأخر غيره، مسددة جزئيًا إذا دُفع أي مبلغ دون تأخر
 * أو استحقاق اليوم، وإلا فهي قادمة. */
export function deriveTransactionStatus(
  installments: InstallmentLike[],
  today: Date = new Date(),
): LmStatus {
  if (installments.length === 0) return "UPCOMING";
  const statuses = installments.map((i) => deriveInstallmentStatus(i, today));

  if (statuses.every((s) => s === "PAID")) return "PAID";
  if (statuses.some((s) => s === "LATE")) return "LATE";
  if (statuses.some((s) => s === "DUE_TODAY")) return "DUE_TODAY";
  if (statuses.some((s) => s === "PAID" || s === "PARTIAL")) return "PARTIAL";
  return "UPCOMING";
}

export function matchesStatusFilter(status: LmStatus, filter: string): boolean {
  if (filter === "ALL") return true;
  if (filter === "UNPAID") return status !== "PAID";
  return status === filter;
}
