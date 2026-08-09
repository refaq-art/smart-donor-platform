import { prisma } from "@/lib/prisma";
import { computeOrgProgress } from "@/lib/progress";

export async function getConsultantOrgSummaries(consultantId: string) {
  const orgs = await prisma.organization.findMany({
    where: { consultantId },
    include: {
      assessmentCycles: true,
      developmentPlans: { include: { tasks: true } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return orgs.map((org) => {
    const tasks = org.developmentPlans.flatMap((p) => p.tasks);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const lateTasks = tasks.filter((t) => t.status === "LATE").length;
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const awaitingReviewTasks = tasks.filter((t) => t.status === "AWAITING_REVIEW").length;
    const progress = computeOrgProgress({ programStartDate: org.programStartDate, totalTasks, completedTasks });
    const preCycle = org.assessmentCycles.find((c) => c.phase === "PRE");
    const postCycle = org.assessmentCycles.find((c) => c.phase === "POST");
    const lastActivity = org.activityLogs[0]?.createdAt ?? null;
    const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      org,
      totalTasks,
      completedTasks,
      lateTasks,
      inProgressTasks,
      awaitingReviewTasks,
      progress,
      preCycle,
      postCycle,
      lastActivity,
      daysSinceActivity,
    };
  });
}

export type ConsultantOrgSummary = Awaited<ReturnType<typeof getConsultantOrgSummaries>>[number];
