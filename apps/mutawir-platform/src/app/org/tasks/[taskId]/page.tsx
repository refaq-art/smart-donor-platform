import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASK_STATUS_LABELS, DELAY_REASON_CODES, DELAY_REASON_LABELS, type TaskStatusValue, type DelayReasonCodeValue } from "@/lib/constants";
import { uploadTaskEvidenceAction, updateTaskProgressAction, submitTaskForReviewAction, recordTaskDelayAction } from "@/app/actions/task-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { TaskComments } from "@/components/task-comments";

export default async function OrgTaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const user = await requireUser(["ORG"]);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      developmentPlan: true,
      evidence: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      delays: { orderBy: { createdAt: "desc" } },
      reviews: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!task || task.developmentPlan.organizationId !== user.organizationId) notFound();

  const editable = task.status === "NOT_STARTED" || task.status === "IN_PROGRESS" || task.status === "NEEDS_REVISION" || task.status === "LATE";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy-900">{task.title}</h1>
          <span className="badge bg-slate-100 text-slate-700">{TASK_STATUS_LABELS[task.status as TaskStatusValue]}</span>
        </div>
        {task.description && <p className="mb-3 whitespace-pre-line text-sm text-slate-600">{task.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500 md:grid-cols-4">
          <div>تاريخ الاستحقاق: {task.dueDate.toLocaleDateString("ar-SA")}</div>
          <div>نسبة الإنجاز: {task.progressPercent}%</div>
          {task.requiredEvidenceText && <div className="col-span-2">الشاهد المطلوب: {task.requiredEvidenceText}</div>}
        </div>
        {task.consultantNotes && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">ملاحظة المستشار: {task.consultantNotes}</div>
        )}
      </div>

      {task.status === "LATE" && (
        <div className="card">
          <h3 className="mb-2 font-bold text-slate-800">سبب التأخير</h3>
          {task.delays[0] ? (
            <p className="text-sm text-slate-600">
              {DELAY_REASON_LABELS[task.delays[0].reasonCode as DelayReasonCodeValue]} — {task.delays[0].explanation}
            </p>
          ) : (
            <form action={recordTaskDelayAction} className="space-y-2">
              <input type="hidden" name="taskId" value={task.id} />
              <select name="reasonCode" className="input" required>
                {DELAY_REASON_CODES.map((code) => (
                  <option key={code} value={code}>
                    {DELAY_REASON_LABELS[code]}
                  </option>
                ))}
              </select>
              <textarea name="explanation" placeholder="شرح إضافي" className="input" rows={2} required />
              <button type="submit" className="btn-secondary">حفظ سبب التأخير</button>
            </form>
          )}
        </div>
      )}

      {editable && (
        <div className="card">
          <h3 className="mb-2 font-bold text-slate-800">تحديث نسبة الإنجاز</h3>
          <form action={updateTaskProgressAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="number" name="progressPercent" min={0} max={100} defaultValue={task.progressPercent} className="input w-24" />
            <input type="text" name="orgNotes" placeholder="ملاحظات" defaultValue={task.orgNotes ?? ""} className="input flex-1" />
            <button type="submit" className="btn-secondary">حفظ</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="mb-2 font-bold text-slate-800">شواهد الإنجاز</h3>
        <div className="mb-3 space-y-2">
          {task.evidence.map((e) => (
            <a key={e.id} href={e.fileUrl ?? e.linkUrl ?? "#"} target="_blank" className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-navy-700 underline">
              {e.fileName}
            </a>
          ))}
          {task.evidence.length === 0 && <p className="text-sm text-slate-400">لم يتم رفع شواهد بعد.</p>}
        </div>
        {editable && (
          <form action={uploadTaskEvidenceAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="file" name="file" className="text-xs" />
            <span className="text-xs text-slate-400">أو</span>
            <input type="url" name="linkUrl" placeholder="رابط..." className="input w-40 text-xs" dir="ltr" />
            <button type="submit" className="btn-secondary py-1 text-xs">رفع شاهد</button>
          </form>
        )}
      </div>

      {editable && (
        <ConfirmSubmitButton action={submitTaskForReviewAction.bind(null, task.id)} confirmMessage="سيتم إرسال المهمة للمستشار للمراجعة. هل أنت متأكد؟">
          إرسال للمراجعة
        </ConfirmSubmitButton>
      )}

      <TaskComments taskId={task.id} comments={task.comments} />
    </div>
  );
}
