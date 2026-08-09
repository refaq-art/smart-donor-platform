"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  const notification = await prisma.notification.findUniqueOrThrow({ where: { id: notificationId } });
  if (notification.userId !== user.id) throw new Error("غير مصرح");
  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  revalidatePath("/org/notifications");
  revalidatePath("/consultant/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/org/notifications");
  revalidatePath("/consultant/notifications");
}
