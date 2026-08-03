"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import type { UserFormState } from "@/app/actions/users";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
      إضافة المستخدم
    </button>
  );
}

export default function NewUserForm({
  action,
}: {
  action: (prev: UserFormState, formData: FormData) => Promise<UserFormState>;
}) {
  const [state, formAction] = useFormState<UserFormState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="card grid gap-3 p-5 sm:grid-cols-2">
      <p className="text-sm font-black text-brand-700 sm:col-span-2">إضافة مستخدم جديد</p>
      <div>
        <label className="field-label">الاسم</label>
        <input className="input" name="name" required />
      </div>
      <div>
        <label className="field-label">البريد الإلكتروني</label>
        <input className="input" name="email" type="email" required dir="ltr" />
      </div>
      <div>
        <label className="field-label">كلمة المرور المبدئية</label>
        <input className="input" name="password" type="text" required minLength={6} dir="ltr" />
      </div>
      <div>
        <label className="field-label">الدور</label>
        <select className="select" name="role" defaultValue={ROLES.GRANTS_OFFICER}>
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="text-xs font-bold text-red-600 sm:col-span-2">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 sm:col-span-2">
          <CheckCircle2 size={14} /> تم إضافة المستخدم بنجاح
        </p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
