import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تُنتج روابط مختصرة (slugs) بحروف لاتينية/أرقام فقط، مع حذف الأحرف العربية بدل
 * ترميزها في الرابط. Next.js 14 App Router (نسخة next dev المستخدمة هنا) لا يطابق
 * بشكل موثوق مقاطع المسار الديناميكية عندما تحتوي على أحرف عربية مرمّزة بالنسبة
 * المئوية (Percent-Encoding) — الرابط يُبنى ويُنقَل إليه بشكل صحيح، لكن مطابقة
 * المسار في الخادم تفشل وتُعيد 404 دائمًا. لتفادي هذه المشكلة جذريًا، تُبنى كل
 * الروابط من الأحرف اللاتينية/الأرقام الموجودة في العنوان (غالبًا كلمات إنجليزية
 * مضمّنة مثل React أو Excel) مع لاحقة عشوائية قصيرة تضمن التفرّد دائمًا؛ عناوين
 * الدورات العربية الكاملة تبقى كما هي داخل الصفحة نفسها، هذا يخص الرابط فقط.
 */
export function slugify(input: string): string {
  const asciiPart = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const shortId = Math.random().toString(36).slice(2, 8);
  return asciiPart ? `${asciiPart}-${shortId}` : `course-${shortId}`;
}

export function formatDateAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: ar });
}

export function formatDateShortAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy", { locale: ar });
}

export function formatNumberAr(value: number): string {
  return new Intl.NumberFormat("ar-EG").format(value);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}
