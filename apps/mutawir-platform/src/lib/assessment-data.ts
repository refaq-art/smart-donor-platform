import { prisma } from "@/lib/prisma";

export async function getFrameworkTree() {
  return prisma.assessmentDomain.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      criteria: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          indicators: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: { levels: { orderBy: { levelNumber: "asc" } }, requiredEvidence: true },
          },
        },
      },
    },
  });
}

export async function getOrCreateAssessmentCycle(organizationId: string, phase: "PRE" | "POST") {
  const existing = await prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase } } });
  if (existing) return existing;
  return prisma.assessmentCycle.create({ data: { organizationId, phase, status: "DRAFT" } });
}

export async function computeCompletionPercent(assessmentCycleId: string) {
  const totalIndicators = await prisma.assessmentIndicator.count({ where: { isActive: true } });
  if (totalIndicators === 0) return 0;

  const [responses, evidence] = await Promise.all([
    prisma.assessmentResponse.findMany({
      where: { assessmentCycleId, answerText: { not: "" } },
      select: { indicatorId: true },
    }),
    prisma.assessmentEvidence.findMany({ where: { assessmentCycleId }, select: { indicatorId: true } }),
  ]);

  const answeredIndicatorIds = new Set([...responses.map((r) => r.indicatorId), ...evidence.map((e) => e.indicatorId)]);
  return Math.round((answeredIndicatorIds.size / totalIndicators) * 100);
}
