import { addTaskCommentAction } from "@/app/actions/task-actions";

export function TaskComments({
  taskId,
  comments,
}: {
  taskId: string;
  comments: { id: string; body: string; createdAt: Date; author: { name: string; role: string } }[];
}) {
  return (
    <div className="card">
      <h3 className="mb-3 font-bold text-slate-800">المحادثة</h3>
      <div className="mb-3 space-y-2">
        {comments.map((c) => (
          <div key={c.id} className={`rounded-lg p-2.5 text-sm ${c.author.role === "CONSULTANT" ? "bg-navy-50" : "bg-slate-50"}`}>
            <div className="mb-0.5 text-xs font-semibold text-slate-600">
              {c.author.name} · {c.createdAt.toLocaleString("ar-SA")}
            </div>
            {c.body}
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-slate-400">لا توجد رسائل بعد.</p>}
      </div>
      <form action={addTaskCommentAction} className="flex gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="text" name="body" placeholder="اكتب رسالة..." className="input" required />
        <button type="submit" className="btn-secondary">إرسال</button>
      </form>
    </div>
  );
}
