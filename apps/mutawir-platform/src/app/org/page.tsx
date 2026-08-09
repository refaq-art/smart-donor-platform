import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeOrgProgress } from "@/lib/progress";
import { getOrgNextActions } from "@/lib/next-actions";
import { PROGRESS_STATUS_COLORS, PROGRESS_STATUS_LABELS } from "@/lib/constants";

export default async function OrgHomePage() {
  const user = await requireUser(["ORG"]);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId! } });

  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId: org.id } });
  const [totalTasks, completedTasks, lateTasks, currentTasks] = plan
    ? await Promise.all([
        prisma.task.count({ where: { developmentPlanId: plan.id } }),
        prisma.task.count({ where: { developmentPlanId: plan.id, status: "COMPLETED" } }),
        prisma.task.count({ where: { developmentPlanId: plan.id, status: "LATE" } }),
        prisma.task.count({ where: { developmentPlanId: plan.id, status: { in: ["IN_PROGRESS", "AWAITING_REVIEW"] } } }),
      ])
    : [0, 0, 0, 0];

  const progress = computeOrgProgress({ programStartDate: org.programStartDate, totalTasks, completedTasks });
  const preCycle = await prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId: org.id, phase: "PRE" } } });
  const nextActions = await getOrgNextActions(org.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">مرحبًا {org.name}</h1>
        {org.programStartDate ? (
          <p className="mt-1 text-slate-500">
            اليوم {progress.currentDay} من {progress.durationDays} · متبقٍ {progress.daysRemaining} يوم
          </p>
        ) : (
          <p className="mt-1 text-slate-500">لم يبدأ برنامج التطوير بعد — يبدأ العدّاد فور اعتماد التقييم القبلي</p>
        )}
      </div>

      {org.programStartDate && (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-slate-400">الوقت المنقضي</div>
                <div className="text-lg font-bold text-navy-800">{progress.elapsedPercent}%</div>
              </div>
              <div>
                <div className="text-slate-400">الإنجاز الفعلي</div>
                <div className="text-lg font-bold text-navy-800">{progress.actualPercent}%</div>
              </div>
              <div>
                <div className="text-slate-400">الفجوة</div>
                <div className={`text-lg font-bold ${progress.gapPercent < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {progress.gapPercent > 0 ? "+" : ""}
                  {progress.gapPercent}%
                </div>
              </div>
            </div>
            <span className={`badge ${PROGRESS_STATUS_COLORS[progress.status]}`}>{PROGRESS_STATUS_LABELS[progress.status]}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy-700" style={{ width: `${progress.actualPercent}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="نتيجة القياس القبلي" value={preCycle?.overallScore ? preCycle.overallScore.toFixed(2) : "—"} />
        <StatCard label="نسبة الإنجاز" value={`${progress.actualPercent}%`} />
        <StatCard label="المهام المكتملة" value={`${completedTasks} / ${totalTasks}`} />
        <StatCard label="المهام المتأخرة" value={String(lateTasks)} highlight={lateTasks > 0} />
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-navy-900">ماذا يجب أن أفعل الآن؟</h2>
        {nextActions.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد إجراءات مطلوبة حاليًا 🎉</p>
        ) : (
          <ul className="space-y-2">
            {nextActions.map((action) => (
              <li key={action.title}>
                <Link
                  href={action.href}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition hover:bg-slate-50 ${
                    action.urgency === "high" ? "border-red-200 bg-red-50/50" : "border-slate-200"
                  }`}
                >
                  <span className="font-medium text-slate-700">{action.title}</span>
                  <span className="text-navy-600">←</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card text-sm text-slate-500">مهام قيد التنفيذ حاليًا: {currentTasks}</div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${highlight ? "text-red-600" : "text-navy-900"}`}>{value}</div>
    </div>
  );
}
