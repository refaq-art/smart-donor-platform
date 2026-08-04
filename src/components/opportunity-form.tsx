"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { OPPORTUNITY_STATUSES } from "@/lib/constants";
import type { OpportunityFormState } from "@/app/actions/opportunities";
import AIAssist from "./ai-assist";
import { Loader2, Save } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}

export default function OpportunityForm({
  action,
  donors,
  projects,
  defaults,
  submitLabel,
}: {
  action: (prev: OpportunityFormState, formData: FormData) => Promise<OpportunityFormState>;
  donors: { id: string; name: string }[];
  projects: { id: string; title: string }[];
  defaults?: {
    title?: string;
    donorId?: string;
    donorNameFreeText?: string;
    field?: string;
    expectedAmount?: number | null;
    requirements?: string;
    startDate?: string;
    deadline?: string;
    applicationUrl?: string;
    status?: string;
    projectId?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<OpportunityFormState, FormData>(action, null);
  const [requirements, setRequirements] = useState(defaults?.requirements || "");
  const [field, setField] = useState(defaults?.field || "");
  const [amount, setAmount] = useState(defaults?.expectedAmount?.toString() || "");
  const [deadline, setDeadline] = useState(defaults?.deadline || "");

  return (
    <form action={formAction} className="space-y-6">
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">عنوان الفرصة *</label>
          <input className="input" name="title" required defaultValue={defaults?.title} />
        </div>
        <div>
          <label className="field-label">الجهة المانحة (من القائمة)</label>
          <select className="select" name="donorId" defaultValue={defaults?.donorId || ""}>
            <option value="">— بدون ربط —</option>
            {donors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">أو اسم جهة غير مسجلة</label>
          <input className="input" name="donorNameFreeText" defaultValue={defaults?.donorNameFreeText} placeholder="اسم الجهة إن لم تكن مسجلة" />
        </div>
        <div>
          <label className="field-label">مجال المنحة</label>
          <input className="input" name="field" value={field} onChange={(e) => setField(e.target.value)} />
        </div>
        <div>
          <label className="field-label">القيمة المتوقعة (ر.س)</label>
          <input className="input" type="number" min={0} name="expectedAmount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="field-label">تاريخ بدء التقديم</label>
          <input className="input" type="date" name="startDate" defaultValue={defaults?.startDate} />
        </div>
        <div>
          <label className="field-label">الموعد النهائي</label>
          <input className="input" type="date" name="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <label className="field-label">حالة الفرصة</label>
          <select className="select" name="status" defaultValue={defaults?.status || "مفتوحة"}>
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">ربط بمشروع</label>
          <select className="select" name="projectId" defaultValue={defaults?.projectId || ""}>
            <option value="">— بدون ربط —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">رابط التقديم</label>
          <input className="input" type="url" name="applicationUrl" defaultValue={defaults?.applicationUrl} dir="ltr" placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="field-label !mb-0">الشروط والمتطلبات</label>
            <AIAssist
              label="تلخيص الشروط"
              action="summarize_opportunity"
              getContext={() => ({ requirements, field, expectedAmount: amount, deadline })}
              onApply={(t) => setRequirements(`${t}\n\n${requirements}`)}
              mode="append"
            />
          </div>
          <textarea className="textarea" name="requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
