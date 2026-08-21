// أدوات التعامل مع المبالغ المالية (ريال سعودي) — تقريب آمن بمنزلتين عشريتين
// دون فقدان أي هللة عبر تراكم أخطاء الفاصلة العائمة.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatSAR(value: number): string {
  const rounded = round2(value);
  // أرقام لاتينية (nu-latn) عمدًا لا هندية شرقية — لاتساق التنسيق مع التواريخ
  // المعروضة في كل الوحدة (formatDate في lib/utils.ts تستخدم نفس القاعدة).
  const formatted = new Intl.NumberFormat("ar-SA-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));
  return `${rounded < 0 ? "-" : ""}${formatted} ر.س`;
}

// مقارنة مبلغين مع هامش تسامح صغير جدًا لتفادي مشاكل الفاصلة العائمة
// (مثل 0.1 + 0.2 !== 0.3) عند التحقق من "هل اكتمل السداد؟".
const EPSILON = 0.005;

export function isZeroOrLess(value: number): boolean {
  return value <= EPSILON;
}

export function isEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

export function isGreaterOrEqual(a: number, b: number): boolean {
  return a - b >= -EPSILON;
}
