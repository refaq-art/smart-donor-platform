"use client";

import { useFormState, useFormStatus } from "react-dom";
import { DONOR_TYPES, DONOR_RELATIONSHIP_STATUSES } from "@/lib/constants";
import type { DonorFormState } from "@/app/actions/donors";
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

export default function DonorForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: DonorFormState, formData: FormData) => Promise<DonorFormState>;
  defaults?: {
    name?: string;
    type?: string;
    supportFields?: string;
    fundingConditions?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    city?: string;
    relationshipStatus?: string;
    notes?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<DonorFormState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">اسم الجهة المانحة *</label>
          <input className="input" name="name" required defaultValue={defaults?.name} />
        </div>
        <div>
          <label className="field-label">نوع الجهة</label>
          <select className="select" name="type" defaultValue={defaults?.type || ""}>
            <option value="">اختر النوع</option>
            {DONOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">حالة العلاقة</label>
          <select className="select" name="relationshipStatus" defaultValue={defaults?.relationshipStatus || "محتمل"}>
            {DONOR_RELATIONSHIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">مجالات الدعم</label>
          <input className="input" name="supportFields" defaultValue={defaults?.supportFields} placeholder="تعليمي، صحي..." />
        </div>
        <div>
          <label className="field-label">المدينة</label>
          <input className="input" name="city" defaultValue={defaults?.city} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">شروط التمويل</label>
          <textarea className="textarea min-h-[80px]" name="fundingConditions" defaultValue={defaults?.fundingConditions} />
        </div>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <p className="text-sm font-black text-brand-700 sm:col-span-2">بيانات التواصل</p>
        <div>
          <label className="field-label">اسم المسؤول</label>
          <input className="input" name="contactName" defaultValue={defaults?.contactName} />
        </div>
        <div>
          <label className="field-label">رقم الهاتف</label>
          <input className="input" name="phone" defaultValue={defaults?.phone} dir="ltr" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">البريد الإلكتروني</label>
          <input className="input" name="email" type="email" defaultValue={defaults?.email} dir="ltr" />
        </div>
      </div>

      <div className="card p-5">
        <label className="field-label">ملاحظات</label>
        <textarea className="textarea" name="notes" defaultValue={defaults?.notes} />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
