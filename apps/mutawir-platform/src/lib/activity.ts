import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      organizationId: params.organizationId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });
}

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}
