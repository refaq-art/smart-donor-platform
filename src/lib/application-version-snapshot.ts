import { prisma } from "./prisma";
import { FIELD_KEYS, type Fields } from "./application-fields";
import type { GrantApplication } from "@prisma/client";

/** يبني لقطة JSON من محتوى الطلب الحالي — تُستخدم قبل كل تعديل جوهري. */
export function buildSnapshot(app: GrantApplication): Fields & { title: string } {
  const snapshot: Record<string, string> = { title: app.title };
  for (const key of FIELD_KEYS) snapshot[key] = (app[key as keyof GrantApplication] as string | null) || "";
  return snapshot as Fields & { title: string };
}

/** يحفظ لقطة من حالة الطلب الحالية قبل الكتابة فوقها، لبناء سجل إصدارات مفيد. */
export async function snapshotIfChanged(
  applicationId: string,
  current: GrantApplication,
  userId: string,
  label?: string
) {
  const last = await prisma.applicationVersion.findFirst({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
  const snapshot = JSON.stringify(buildSnapshot(current));
  if (last && last.snapshot === snapshot && !label) return; // لا تكرر لقطات متطابقة
  await prisma.applicationVersion.create({
    data: { applicationId, snapshot, createdById: userId, label: label || null },
  });
}
