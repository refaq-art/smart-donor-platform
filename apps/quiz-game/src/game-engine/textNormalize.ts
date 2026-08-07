/**
 * تطبيع النصوص العربية لمقارنة إجابات "تخمين الكلمة/الشخصية" بمرونة:
 * إزالة التشكيل، توحيد الألف والهمزات والتاء المربوطة، إزالة المسافات الزائدة.
 */
export function normalizeArabicText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // تشكيل وتطويل
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim();
}

export function isTextAnswerCorrect(submitted: string, acceptedAnswers: string[]): boolean {
  const normalizedSubmitted = normalizeArabicText(submitted);
  if (!normalizedSubmitted) return false;
  return acceptedAnswers.some((a) => normalizeArabicText(a) === normalizedSubmitted);
}
