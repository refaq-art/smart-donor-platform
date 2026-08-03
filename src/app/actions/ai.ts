"use server";

import { getAIProvider } from "@/lib/ai";
import type { AIActionType } from "@/lib/ai/types";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function runAiAssist(action: AIActionType, context: Record<string, string | undefined>) {
  const session = await getSession();
  if (!session) return { text: "", provider: "mock" as const, warning: "الرجاء تسجيل الدخول." };

  const provider = getAIProvider();
  const result = await provider.run({ action, context });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: `ai_assist:${action}`,
      entityType: "AI",
      entityId: action,
    },
  });

  return result;
}
