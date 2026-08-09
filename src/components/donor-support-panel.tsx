"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { SupportRecordFormState } from "@/app/actions/donor-support";
import { formatDate, formatMoney } from "@/lib/utils";
import { Wallet, Trash2, Loader2, Plus } from "lucide-react";

type SupportRecord = {
  id: string;
  year: number;
  amount: number;
  notes: string | null;
  createdAt: Date | string;
  project: { id: string; title: string } | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary text-xs" disabled={pending}>
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
      إضافة سجل دعم
    </button>
  );
}

export default function DonorSupportPanel({
  donorId,
  records,
  projects,
  canEdit,
  addAction,
  deleteAction,
}: {
  donorId: string;
  records: SupportRecord[];
  projects: { id: string; title: string }[];
  canEdit: boolean;
  addAction: (donorId: string, prev: SupportRecordFormState, formData: FormData) => Promise<SupportRecordFormState>;
  deleteAction: (id: string, donorId: string) => Promise<void>;
}) {
  const boundAdd = addAction.bind(null, donorId);
  const [state, formAction] = useFormState<SupportRecordFormState, FormData>(boundAdd, null);

  const total = records.reduce((sum, r) => sum + r.amount, 0);
  const sorted = [...records].sort((a, b) => b.year - a.year);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-ink">
          <Wallet size={16} /> سجل الدعم المالي التاريخي
        </p>
        {records.length > 0 && <span className="text-xs font-bold text-brand-700">الإجمالي: {formatMoney(total)}</span>}
      </div>

      {sorted.length === 0 ? (
        <p className="mb-3 text-xs text-slate-400">لا يوجد سجل دعم سابق مضاف لهذه الجهة بعد.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {sorted.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {r.year} — {formatMoney(r.amount)}
                </p>
                {r.project && <p className="text-[11px] text-slate-400">المشروع: {r.project.title}</p>}
                {r.notes && <p className="mt-0.5 text-[11px] text-slate-500">{r.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-slate-400">
                <span className="hidden sm:inline">{formatDate(r.createdAt)}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteAction(r.id, donorId)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="حذف سجل الدعم"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form action={formAction} className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" name="year" required min={1990} max={2100} className="input w-24 text-xs" placeholder="السنة" />
            <input type="number" name="amount" required min={0} step="0.01" className="input w-32 text-xs" placeholder="المبلغ (ر.س)" />
            {projects.length > 0 && (
              <select name="projectId" className="select w-auto text-xs" defaultValue="">
                <option value="">بدون مشروع محدد</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <SubmitButton />
          </div>
          <input name="notes" className="input" placeholder="ملاحظات (اختياري)" />
          {state?.error && <p className="text-xs font-bold text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
