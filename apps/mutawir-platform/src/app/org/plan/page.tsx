import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncLateTasks } from "@/lib/task-sync";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, type TaskStatusValue, type TaskPriorityValue } from "@/lib/constants";

const STATUS_COLORS: Record<TaskStatusValue, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  AWAITING_REVIEW: "bg-amber-100 text-amber-800",
  NEEDS_REVISION: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  LATE: "bg-red-100 text-red-700",
};

export default async function OrgPlanPage() {
  const user = await requireUser(["ORG"]);
  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId: user.organizationId! } });

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-500">لم يقم المستشار ببناء خطة التطوير بعد. ستظهر هنا فور اعتمادها.</div>
      </div>
    );
  }

  await syncLateTasks(plan.id);
  const tasks = await prisma.task.findMany({ where: { developmentPlanId: plan.id }, orderBy: { dueDate: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">خطة التطوير والمهام</h1>
      <div className="space-y-3">
        {tasks.map((task) => {
          const daysRemaining = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <Link key={task.id} href={`/org/tasks/${task.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:shadow-md">
              <div>
                <div className="font-semibold text-slate-800">{task.title}</div>
                <div className="text-xs text-slate-500">
                  يستحق: {task.dueDate.toLocaleDateString("ar-SA")}
                  {task.status !== "COMPLETED" && (daysRemaining >= 0 ? ` · متبقٍ ${daysRemaining} يوم` : ` · متأخرة ${Math.abs(daysRemaining)} يوم`)}
                  {" · "}الأولوية: {TASK_PRIORITY_LABELS[task.priority as TaskPriorityValue]}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{task.progressPercent}%</span>
                <span className={`badge ${STATUS_COLORS[task.status as TaskStatusValue]}`}>{TASK_STATUS_LABELS[task.status as TaskStatusValue]}</span>
              </div>
            </Link>
          );
        })}
        {tasks.length === 0 && <div className="card text-center text-slate-500">لا توجد مهام حاليًا.</div>}
      </div>
    </div>
  );
}
