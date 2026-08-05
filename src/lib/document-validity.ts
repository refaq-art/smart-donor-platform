import { daysUntil } from "./utils";

/** هل المستند ساري الصلاحية؟ (بدون تاريخ انتهاء يُعتبر ساريًا) */
export function documentIsValid(expiryDate?: Date | string | null): boolean {
  if (!expiryDate) return true;
  const d = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() > Date.now();
}

export type DocumentValidityTone = "neutral" | "danger" | "warn" | "ok";

/** حالة صلاحية المستند بتفصيل أكبر (تُستخدم في مكتبة المستندات ولوحة التحكم). */
export function documentValidity(expiry?: Date | string | null): { label: string; tone: DocumentValidityTone; days: number | null } {
  if (!expiry) return { label: "بدون تاريخ انتهاء", tone: "neutral", days: null };
  const days = daysUntil(expiry);
  if (days === null) return { label: "غير محدد", tone: "neutral", days: null };
  if (days < 0) return { label: "منتهي الصلاحية", tone: "danger", days };
  if (days <= 30) return { label: `ينتهي خلال ${days} يومًا`, tone: "warn", days };
  return { label: "ساري", tone: "ok", days };
}
