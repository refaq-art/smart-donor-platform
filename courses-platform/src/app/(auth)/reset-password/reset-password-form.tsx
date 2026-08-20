"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(resetPasswordAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="field-label" htmlFor="password">
          كلمة المرور الجديدة
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="8 أحرف على الأقل"
          dir="ltr"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="confirmPassword">
          تأكيد كلمة المرور
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="أعد إدخال كلمة المرور"
          dir="ltr"
        />
      </div>

      {state?.error && <FormMessage type="error" message={state.error} />}

      <SubmitButton pendingLabel="جارٍ الحفظ...">تعيين كلمة المرور الجديدة</SubmitButton>
    </form>
  );
}
