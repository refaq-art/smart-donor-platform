/** هل المستند ساري الصلاحية؟ (بدون تاريخ انتهاء يُعتبر ساريًا) */
export function documentIsValid(expiryDate?: Date | string | null): boolean {
  if (!expiryDate) return true;
  const d = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() > Date.now();
}
