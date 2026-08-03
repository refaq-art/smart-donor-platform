"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { APPLICATION_STATUSES, STATUS_COLORS } from "@/lib/constants";
import type { StatusChangeState } from "@/app/actions/applications";
import { Badge } from "./ui-bits";
import { Loader2, ArrowLeftRight, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? <Loader2 size={15} className="animate-spin" /> : <ArrowLeftRight size={15} />}
      تحديث الحالة
    </button>
  );
}

export default function StatusPanel({
  currentStatus,
  action,
  canChange,
}: {
  currentStatus: string;
  action: (prev: StatusChangeState, formData: FormData) => Promise<StatusChangeState>;
  canChange: boolean;
}) {
  const [state, formAction] = useFormState<StatusChangeState, FormData>(action, null);
  const [toStatus, setToStatus] = useState(currentStatus);

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-black text-ink">حالة الطلب</p>
      <div className="mb-4">
        <Badge label={currentStatus} colorClass={STATUS_COLORS[currentStatus]} />
      </div>

      {canChange ? (
        <form action={formAction} className="space-y-3">
          <div>
            <label className="field-label">الحالة الجديدة</label>
            <select className="select" name="toStatus" value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">ملاحظة</label>
            <textarea className="textarea min-h-[70px]" name="note" placeholder="سبب التغيير أو أي ملاحظات" />
          </div>
          <div>
            <label className="field-label">الخطوة التالية</label>
            <input className="input" name="nextStep" placeholder="مثال: انتظار رد الجهة المانحة" />
          </div>
          {state?.error && <p className="text-xs font-bold text-red-600">{state.error}</p>}
          {state?.savedAt && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 size={14} /> تم تحديث الحالة
            </p>
          )}
          <SubmitButton />
        </form>
      ) : (
        <p className="text-xs text-slate-400">ليست لديك صلاحية لتغيير حالة الطلب.</p>
      )}
    </div>
  );
}
