import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASK_STATUS_LABELS, DELAY_REASON_LABELS, type TaskStatusValue, type DelayReasonCodeValue } from "@/lib/constants";
import { reviewTaskAction } from "@/app/actions/task-actions";
import { TaskComments } from "@/components/task-comments";

export default async function ConsultantTaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const user = await requireUser(["CONSULTANT"]);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      developmentPlan: { include: { organization: { include: { consultant: true } } } },
      evidence: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      delays: true,
      reviews: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!task || task.developmentPlan.organization.consultant?.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy-900">{task.title}</h1>
          <span className="badge bg-slate-100 text-slate-700">{TASK_STATUS_LABELS[task.status as TaskStatusValue]}</span>
        </div>
        <p className="text-sm text-slate-500">{task.developmentPlan.organization.name}</p>
        {task.description && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{task.description}</p>}
        {task.orgNotes && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">ملاحظات الجمعية: {task.orgNotes}</div>}
        {task.delays[0] && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            سبب التأخير: {DELAY_REASON_LABELS[task.delays[0].reasonCode as DelayReasonCodeValue]} — {task.delays[0].explanation}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="mb-2 font-bold text-slate-800">شواهد الإنجاز</h3>
        <div className="space-y-2">
          {task.evidence.map((e) => (
            <a key={e.id} href={e.fileUrl ?? e.linkUrl ?? "#"} target="_blank" className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-navy-700 underline">
              {e.fileName}
            </a>
          ))}
          {task.evidence.length === 0 && <p className="text-sm text-slate-400">لا توجد شواهد.</p>}
        </div>
      </div>

      {task.status === "AWAITING_REVIEW" && (
        <div className="card">
          <h3 className="mb-2 font-bold text-slate-800">قرار المراجعة</h3>
          <form action={reviewTaskAction} className="space-y-2">
            <input type="hidden" name="taskId" value={task.id} />
            <textarea name="note" placeholder="ملاحظة (اختياري لاعتماد، مطلوبة لطلب تعديل)" className="input" rows={2} />
            <div className="flex gap-2">
              <button name="decision" value="APPROVED" className="btn-primary">اعتماد الإنجاز</button>
              <button name="decision" value="NEEDS_REVISION" className="btn-secondary">طلب تعديل</button>
            </div>
          </form>
        </div>
      )}

      <TaskComments taskId={task.id} comments={task.comments} />
    </div>
  );
}
