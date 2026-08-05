"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import type { CommentFormState } from "@/app/actions/application-comments";
import { FIELD_LABELS, type Fields } from "@/lib/application-fields";
import { formatDate, cn } from "@/lib/utils";
import { MessageSquare, CheckCircle2, RotateCcw, Trash2, Loader2, AlertCircle } from "lucide-react";

type Comment = {
  id: string;
  fieldKey: string | null;
  body: string;
  status: string;
  kind: string;
  createdAt: Date | string;
  resolvedAt: Date | string | null;
  author: { id: string; name: string };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary text-xs" disabled={pending}>
      {pending ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
      إضافة الملاحظة
    </button>
  );
}

export default function ApplicationCommentsPanel({
  applicationId,
  comments,
  currentUserId,
  canComment,
  canReview,
  canDeleteAny,
  addAction,
  resolveAction,
  deleteAction,
}: {
  applicationId: string;
  comments: Comment[];
  currentUserId: string;
  canComment: boolean;
  canReview: boolean;
  canDeleteAny: boolean;
  addAction: (applicationId: string, prev: CommentFormState, formData: FormData) => Promise<CommentFormState>;
  resolveAction: (commentId: string, applicationId: string, resolve: boolean) => Promise<void>;
  deleteAction: (commentId: string, applicationId: string) => Promise<void>;
}) {
  const boundAdd = addAction.bind(null, applicationId);
  const [state, formAction] = useFormState<CommentFormState, FormData>(boundAdd, null);
  const [filter, setFilter] = useState<"OPEN" | "ALL">("OPEN");

  const visible = filter === "OPEN" ? comments.filter((c) => c.status === "OPEN") : comments;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-ink">
          <MessageSquare size={16} /> ملاحظات المراجعة
        </p>
        <div className="flex gap-1 text-[11px] font-bold">
          <button
            onClick={() => setFilter("OPEN")}
            className={cn("rounded-lg px-2 py-1", filter === "OPEN" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500")}
          >
            مفتوحة ({comments.filter((c) => c.status === "OPEN").length})
          </button>
          <button
            onClick={() => setFilter("ALL")}
            className={cn("rounded-lg px-2 py-1", filter === "ALL" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500")}
          >
            الكل ({comments.length})
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mb-3 text-xs text-slate-400">لا توجد ملاحظات.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {visible.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-lg border p-3 text-xs",
                c.status === "RESOLVED" ? "border-slate-200 bg-slate-50 opacity-70" : "border-amber-200 bg-amber-50/40"
              )}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {c.kind === "CHANGE_REQUEST" && (
                  <span className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                    <AlertCircle size={11} /> طلب تعديل
                  </span>
                )}
                {c.fieldKey && FIELD_LABELS[c.fieldKey as keyof Fields] && (
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                    {FIELD_LABELS[c.fieldKey as keyof Fields]}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-500">{c.author.name}</span>
                <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
              </div>
              <p className="leading-relaxed text-ink">{c.body}</p>
              <div className="mt-2 flex items-center gap-3">
                {canComment && (
                  <button
                    type="button"
                    onClick={() => resolveAction(c.id, applicationId, c.status !== "RESOLVED")}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    {c.status === "RESOLVED" ? (
                      <>
                        <RotateCcw size={12} /> إعادة الفتح
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} /> وضع علامة معالَجة
                      </>
                    )}
                  </button>
                )}
                {(canDeleteAny || c.author.id === currentUserId) && (
                  <button
                    type="button"
                    onClick={() => deleteAction(c.id, applicationId)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
                  >
                    <Trash2 size={12} /> حذف
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form action={formAction} className="space-y-2 border-t border-slate-100 pt-3">
          <textarea name="body" required minLength={2} className="textarea" rows={2} placeholder="اكتب ملاحظتك..." />
          <div className="flex flex-wrap items-center gap-2">
            <select name="fieldKey" className="select w-auto text-xs" defaultValue="">
              <option value="">ملاحظة عامة</option>
              {Object.entries(FIELD_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <select name="kind" className="select w-auto text-xs" defaultValue="NOTE">
              <option value="NOTE">ملاحظة</option>
              {canReview && <option value="CHANGE_REQUEST">طلب تعديل</option>}
            </select>
            <SubmitButton />
          </div>
          {state?.error && <p className="text-xs font-bold text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
