import { prisma } from "@/lib/prisma";

export async function computeImpactReport(organizationId: string) {
  const [preCycle, postCycle] = await Promise.all([
    prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase: "PRE" } } }),
    prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase: "POST" } } }),
  ]);

  const preApproved = preCycle?.status === "APPROVED" ? preCycle : null;
  const postApproved = postCycle?.status === "APPROVED" ? postCycle : null;

  if (!preApproved) return { ready: false as const, preCycle, postCycle };

  const preDecisions = await prisma.consultantAssessment.findMany({
    where: { assessmentCycleId: preApproved.id },
    include: { indicator: { include: { criterion: { include: { domain: true } } } } },
  });

  const postDecisions = postApproved
    ? await prisma.consultantAssessment.findMany({
        where: { assessmentCycleId: postApproved.id },
        include: { indicator: { include: { criterion: { include: { domain: true } } } } },
      })
    : [];

  const domainNames = Array.from(new Set(preDecisions.map((d) => d.indicator.criterion.domain.name)));
  const perDomain = domainNames.map((domainName) => {
    const preScores = preDecisions.filter((d) => d.indicator.criterion.domain.name === domainName).map((d) => d.finalScore);
    const postScores = postDecisions.filter((d) => d.indicator.criterion.domain.name === domainName).map((d) => d.finalScore);
    const preAvg = preScores.length ? preScores.reduce((a, b) => a + b, 0) / preScores.length : null;
    const postAvg = postScores.length ? postScores.reduce((a, b) => a + b, 0) / postScores.length : null;
    return { domainName, preAvg, postAvg, improvement: preAvg != null && postAvg != null ? postAvg - preAvg : null };
  });

  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId }, include: { tasks: true } });
  const completedTasks = plan?.tasks.filter((t) => t.status === "COMPLETED") ?? [];
  const incompleteTasks = plan?.tasks.filter((t) => t.status !== "COMPLETED") ?? [];

  return {
    ready: true as const,
    preScore: preApproved.overallScore,
    postScore: postApproved?.overallScore ?? null,
    improvement: postApproved?.overallScore != null && preApproved.overallScore != null ? postApproved.overallScore - preApproved.overallScore : null,
    perDomain,
    completedTasks,
    incompleteTasks,
    postApproved: Boolean(postApproved),
  };
}
