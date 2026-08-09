import { prisma } from "@/lib/prisma";
import { computeOrgProgress } from "@/lib/progress";

export async function getCouncilOverview() {
  const orgs = await prisma.organization.findMany({
    include: {
      consultant: { include: { user: true } },
      assessmentCycles: true,
      developmentPlans: { include: { tasks: true } },
    },
  });

  const summaries = orgs.map((org) => {
    const tasks = org.developmentPlans.flatMap((p) => p.tasks);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const lateTasks = tasks.filter((t) => t.status === "LATE").length;
    const progress = computeOrgProgress({ programStartDate: org.programStartDate, totalTasks, completedTasks });
    const preCycle = org.assessmentCycles.find((c) => c.phase === "PRE" && c.status === "APPROVED");
    const postCycle = org.assessmentCycles.find((c) => c.phase === "POST" && c.status === "APPROVED");
    const improvement = preCycle?.overallScore != null && postCycle?.overallScore != null ? postCycle.overallScore - preCycle.overallScore : null;
    return { org, totalTasks, completedTasks, lateTasks, progress, preCycle, postCycle, improvement };
  });

  const withProgram = summaries.filter((s) => s.org.programStartDate);
  const onTrack = withProgram.filter((s) => s.progress.status === "AHEAD" || s.progress.status === "ON_TRACK").length;
  const late = withProgram.filter((s) => s.progress.status === "LATE").length;
  const veryLate = withProgram.filter((s) => s.progress.status === "VERY_LATE").length;

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const consultants = await prisma.consultant.findMany({ include: { user: true, organizations: true } });
  const consultantPerformance = consultants.map((c) => {
    const theirSummaries = summaries.filter((s) => s.org.consultantId === c.id);
    const totalTasksAll = theirSummaries.reduce((sum, s) => sum + s.totalTasks, 0);
    const completedAll = theirSummaries.reduce((sum, s) => sum + s.completedTasks, 0);
    return {
      consultant: c,
      orgCount: c.organizations.length,
      avgCompletion: totalTasksAll > 0 ? Math.round((completedAll / totalTasksAll) * 100) : 0,
    };
  });

  return {
    summaries,
    totalOrgs: orgs.length,
    onTrack,
    late,
    veryLate,
    avgCompletion: Math.round(avg(summaries.map((s) => s.progress.actualPercent)) ?? 0),
    avgPreScore: avg(summaries.map((s) => s.preCycle?.overallScore).filter((x): x is number => x != null)),
    avgPostScore: avg(summaries.map((s) => s.postCycle?.overallScore).filter((x): x is number => x != null)),
    avgImprovement: avg(summaries.map((s) => s.improvement).filter((x): x is number => x != null)),
    openTasks: summaries.reduce((sum, s) => sum + s.totalTasks - s.completedTasks, 0),
    lateTasks: summaries.reduce((sum, s) => sum + s.lateTasks, 0),
    consultantCount: consultants.length,
    consultantPerformance,
    mostAdvanced: [...summaries].sort((a, b) => b.progress.actualPercent - a.progress.actualPercent).slice(0, 5),
    mostDelayed: [...summaries].sort((a, b) => a.progress.gapPercent - b.progress.gapPercent).slice(0, 5),
  };
}
