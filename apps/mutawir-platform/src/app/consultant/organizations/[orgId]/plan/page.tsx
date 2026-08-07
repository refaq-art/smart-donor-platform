import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncLateTasks } from "@/lib/task-sync";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, type TaskStatusValue, type TaskPriorityValue } from "@/lib/constants";
import { createTaskAction } from "@/app/actions/plan-actions";

const STATUS_COLORS: Record<TaskStatusValue, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  AWAITING_REVIEW: "bg-amber-100 text-amber-800",
  NEEDS_REVISION: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  LATE: "bg-red-100 text-red-700",
};

export default async function ConsultantPlanPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await requireUser(["CONSULTANT"]);
  const org = await prisma.organization.findFirst({ where: { id: orgId, consultantId: user.consultant!.id } });
  if (!org) notFound();

  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId: orgId } });
  if (plan) await syncLateTasks(plan.id);
  const tasks = plan ? await prisma.task.findMany({ where: { developmentPlanId: plan.id }, orderBy: { dueDate: "asc" } }) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">خطة تطوير الجمعية — 100 يوم — {org.name}</h1>

      <details className="card">
        <summary className="cursor-pointer font-bold text-slate-700">+ إضافة مهمة يدويًا</summary>
        <form action={createTaskAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="organizationId" value={orgId} />
          <input className="input md:col-span-2" name="title" placeholder="اسم المهمة" required />
          <textarea className="input md:col-span-2" name="description" placeholder="وصف المطلوب" rows={2} />
          <input className="input" name="assigneeLabel" placeholder="المسؤول" />
          <select className="input" name="priority" defaultValue="MEDIUM">
            <option value="LOW">أولوية منخفضة</option>
            <option value="MEDIUM">أولوية متوسطة</option>
            <option value="HIGH">أولوية عالية</option>
            <option value="CRITICAL">أولوية حرجة</option>
          </select>
          <input className="input" type="date" name="startDate" required />
          <input className="input" type="date" name="dueDate" required />
          <input className="input md:col-span-2" name="requiredEvidenceText" placeholder="الشاهد المطلوب" />
          <button type="submit" className="btn-primary md:col-span-2">إضافة المهمة</button>
        </form>
      </details>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Link key={task.id} href={`/consultant/tasks/${task.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:shadow-md">
            <div>
              <div className="font-semibold text-slate-800">{task.title}</div>
              <div className="text-xs text-slate-500">
                {task.assigneeLabel ?? "—"} · يستحق: {task.dueDate.toLocaleDateString("ar-SA")} · الأولوية: {TASK_PRIORITY_LABELS[task.priority as TaskPriorityValue]}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{task.progressPercent}%</span>
              <span className={`badge ${STATUS_COLORS[task.status as TaskStatusValue]}`}>{TASK_STATUS_LABELS[task.status as TaskStatusValue]}</span>
            </div>
          </Link>
        ))}
        {tasks.length === 0 && <div className="card text-center text-slate-500">لا توجد مهام بعد.</div>}
      </div>
    </div>
  );
}
