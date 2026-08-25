import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-SA").format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return `${formatNumber(value)} ريال`;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  ready: "جاهز",
  sent: "تم الإرسال",
  viewed: "تمت المشاهدة",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}
