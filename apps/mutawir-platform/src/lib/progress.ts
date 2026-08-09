import type { ProgressStatusValue } from "@/lib/constants";

export function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function programDay(programStartDate: Date | null, durationDays = 100, now: Date = new Date()) {
  if (!programStartDate) return { currentDay: 0, elapsedPercent: 0, daysRemaining: durationDays };
  const elapsed = Math.max(0, daysBetween(programStartDate, now));
  const currentDay = Math.min(durationDays, elapsed + 1);
  const elapsedPercent = Math.min(100, Math.round((elapsed / durationDays) * 100));
  const daysRemaining = Math.max(0, durationDays - elapsed);
  return { currentDay, elapsedPercent, daysRemaining };
}

export function classifyProgress(actualPercent: number, expectedPercent: number): ProgressStatusValue {
  const gap = actualPercent - expectedPercent;
  if (gap >= 10) return "AHEAD";
  if (gap >= -5) return "ON_TRACK";
  if (gap >= -15) return "NEEDS_ATTENTION";
  if (gap >= -30) return "LATE";
  return "VERY_LATE";
}

export function computeOrgProgress(params: {
  programStartDate: Date | null;
  durationDays?: number;
  totalTasks: number;
  completedTasks: number;
  now?: Date;
}) {
  const durationDays = params.durationDays ?? 100;
  const { currentDay, elapsedPercent, daysRemaining } = programDay(params.programStartDate, durationDays, params.now);
  const actualPercent = params.totalTasks > 0 ? Math.round((params.completedTasks / params.totalTasks) * 100) : 0;
  const status = params.programStartDate ? classifyProgress(actualPercent, elapsedPercent) : "ON_TRACK";
  return {
    currentDay,
    durationDays,
    elapsedPercent,
    actualPercent,
    gapPercent: actualPercent - elapsedPercent,
    daysRemaining,
    status,
  };
}
