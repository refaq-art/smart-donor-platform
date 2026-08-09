import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeOrgProgress } from "@/lib/progress";
import { PROGRESS_STATUS_COLORS, PROGRESS_STATUS_LABELS, DELAY_REASON_LABELS, type DelayReasonCodeValue } from "@/lib/constants";

export default async function CouncilOrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireUser(["COUNCIL"]);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { consultant: { include: { user: true } }, assessmentCycles: true },
  });
  if (!org) notFound();

  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId: orgId }, include: { tasks: { include: { delays: true } } } });
  const totalTasks = plan?.tasks.length ?? 0;
  const completedTasks = plan?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const lateTasks = plan?.tasks.filter((t) => t.status === "LATE") ?? [];
  const progress = computeOrgProgress({ programStartDate: org.programStartDate, totalTasks, completedTasks });
  const preCycle = org.assessmentCycles.find((c) => c.phase === "PRE");
  const postCycle = org.assessmentCycles.find((c) => c.phase === "POST");
  const consultantNotes = plan?.tasks.map((t) => t.consultantNotes).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{org.name}</h1>
        <p className="text-sm text-slate-500">المستشار: {org.consultant?.user.name ?? "—"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="نتيجة القياس القبلي" value={preCycle?.overallScore?.toFixed(2) ?? "—"} />
        <Stat label="نتيجة القياس البعدي" value={postCycle?.overallScore?.toFixed(2) ?? "—"} />
        <Stat label="نسبة الإنجاز" value={`${progress.actualPercent}%`} />
        <Stat label="اليوم الحالي" value={org.programStartDate ? `${progress.currentDay}/${progress.durationDays}` : "—"} />
        <Stat label="المهام المكتملة" value={`${completedTasks}/${totalTasks}`} />
        <Stat label="المهام المتأخرة" value={lateTasks.length} />
        {preCycle?.overallScore != null && postCycle?.overallScore != null && (
          <Stat label="مستوى التحسن" value={`+${(postCycle.overallScore - preCycle.overallScore).toFixed(2)}`} />
        )}
        {org.programStartDate && <span className={`badge self-start ${PROGRESS_STATUS_COLORS[progress.status]}`}>{PROGRESS_STATUS_LABELS[progress.status]}</span>}
      </div>

      {lateTasks.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-bold text-slate-800">أسباب التأخير</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {lateTasks.map((t) => (
              <li key={t.id}>
                {t.title}: {t.delays[0] ? DELAY_REASON_LABELS[t.delays[0].reasonCode as DelayReasonCodeValue] : "لم يُحدَّد بعد"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {consultantNotes.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-bold text-slate-800">ملاحظات المستشار</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {consultantNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy-900">{value}</div>
    </div>
  );
}
