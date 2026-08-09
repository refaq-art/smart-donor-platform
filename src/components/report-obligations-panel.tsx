"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ReportObligationFormState } from "@/app/actions/report-obligations";
import { REPORT_OBLIGATION_TYPES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import { ClipboardCheck, CheckCircle2, RotateCcw, Trash2, Loader2, AlertTriangle } from "lucide-react";

type Obligation = {
  id: string;
  title: string;
  type: string;
  dueDate: Date | string;
  status: string;
  submittedAt: Date | string | null;
  notes: string | null;
};

function statusInfo(o: Obligation) {
  if (o.status === "SUBMITTED") return { label: "تم التقديم", tone: "emerald" as const };
  const overdue = new Date(o.dueDate).getTime() < Date.now();
  return overdue ? { label: "متأخر", tone: "red" as const } : { label: "مستحق", tone: "amber" as const };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary text-xs" disabled={pending}>
      {pending ? <Loader2 size={13} className="animate-spin" /> : <ClipboardCheck size={13} />}
      إضافة التزام
    </button>
  );
}

export default function ReportObligationsPanel({
  applicationId,
  obligations,
  canEdit,
  addAction,
  setSubmittedAction,
  deleteAction,
}: {
  applicationId: string;
  obligations: Obligation[];
  canEdit: boolean;
  addAction: (applicationId: string, prev: ReportObligationFormState, formData: FormData) => Promise<ReportObligationFormState>;
  setSubmittedAction: (id: string, applicationId: string, submitted: boolean) => Promise<void>;
  deleteAction: (id: string, applicationId: string) => Promise<void>;
}) {
  const boundAdd = addAction.bind(null, applicationId);
  const [state, formAction] = useFormState<ReportObligationFormState, FormData>(boundAdd, null);

  const overdueCount = obligations.filter((o) => o.status === "PENDING" && new Date(o.dueDate).getTime() < Date.now()).length;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-ink">
          <ClipboardCheck size={16} /> التزامات التقارير لما بعد القبول
        </p>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
            <AlertTriangle size={11} /> {overdueCount} متأخر
          </span>
        )}
      </div>

      {obligations.length === 0 ? (
        <p className="mb-3 text-xs text-slate-400">لا توجد التزامات تقارير مسجلة لهذه المنحة بعد.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {obligations.map((o) => {
            const s = statusInfo(o);
            return (
              <li
                key={o.id}
                className={cn(
                  "rounded-lg border p-3 text-xs",
                  s.tone === "emerald" && "border-slate-200 bg-slate-50 opacity-70",
                  s.tone === "red" && "border-red-200 bg-red-50/40",
                  s.tone === "amber" && "border-amber-200 bg-amber-50/40"
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">{o.type}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold",
                      s.tone === "emerald" && "bg-emerald-100 text-emerald-700",
                      s.tone === "red" && "bg-red-100 text-red-700",
                      s.tone === "amber" && "bg-amber-100 text-amber-700"
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400">الاستحقاق: {formatDate(o.dueDate)}</span>
                </div>
                <p className="font-bold text-ink">{o.title}</p>
                {o.notes && <p className="mt-0.5 leading-relaxed text-slate-500">{o.notes}</p>}
                {o.submittedAt && <p className="mt-0.5 text-[11px] text-emerald-600">قُدّم بتاريخ {formatDate(o.submittedAt)}</p>}
                {canEdit && (
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmittedAction(o.id, applicationId, o.status !== "SUBMITTED")}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      {o.status === "SUBMITTED" ? (
                        <>
                          <RotateCcw size={12} /> إعادة الفتح
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> وضع علامة مُقدَّم
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAction(o.id, applicationId)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
                    >
                      <Trash2 size={12} /> حذف
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && (
        <form action={formAction} className="space-y-2 border-t border-slate-100 pt-3">
          <input name="title" required minLength={2} className="input" placeholder="عنوان التقرير (مثال: تقرير ربعي أول)" />
          <div className="flex flex-wrap items-center gap-2">
            <select name="type" className="select w-auto text-xs" defaultValue={REPORT_OBLIGATION_TYPES[0]}>
              {REPORT_OBLIGATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="date" name="dueDate" required className="input w-auto text-xs" />
            <SubmitButton />
          </div>
          <textarea name="notes" className="textarea" rows={2} placeholder="ملاحظات (اختياري)" />
          {state?.error && <p className="text-xs font-bold text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
