import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n?: number | null) {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("ar-SA-u-nu-latn").format(n) + " ر.س";
}

export function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function daysUntil(d?: Date | string | null) {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function parseJsonArray(s?: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];
  } catch {
    return [];
  }
}

export function toJsonArray(items: string[]): string {
  return JSON.stringify(items.filter((x) => x && x.trim()));
}

export type BudgetItem = { item: string; amount: number };
export function parseBudgetItems(s?: string | null): BudgetItem[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export type KpiItem = { indicator: string; target: string };
export function parseKpis(s?: string | null): KpiItem[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function slugSafeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
