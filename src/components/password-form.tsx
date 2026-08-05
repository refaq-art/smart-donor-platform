"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import type { PasswordState } from "@/app/actions/auth";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
      حفظ كلمة المرور الجديدة
    </button>
  );
}

export default function PasswordForm({
  action,
}: {
  action: (prev: PasswordState, formData: FormData) => Promise<PasswordState>;
}) {
  const [state, formAction] = useFormState<PasswordState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4 p-5">
      <div>
        <label className="field-label" htmlFor="currentPassword">
          كلمة المرور الحالية
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required className="input" dir="ltr" />
      </div>
      <div>
        <label className="field-label" htmlFor="newPassword">
          كلمة المرور الجديدة
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="input"
          dir="ltr"
        />
        <p className="field-hint">8 أحرف على الأقل. يُفضّل مزج الحروف والأرقام والرموز.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">
          تأكيد كلمة المرور الجديدة
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="input"
          dir="ltr"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={16} /> تم تغيير كلمة المرور بنجاح، وأُبطلت جلساتك الأخرى.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
