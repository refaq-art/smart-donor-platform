"use client";

import { useFormState } from "react-dom";
import { changePasswordAction } from "@/app/actions/profile";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export function ChangePasswordForm() {
  const [state, formAction] = useFormState<FormState, FormData>(changePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label className="field-label" htmlFor="currentPassword">
          كلمة المرور الحالية
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          dir="ltr"
        />
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
          autoComplete="new-password"
          className="input"
          dir="ltr"
        />
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
          autoComplete="new-password"
          className="input"
          dir="ltr"
        />
      </div>

      {state?.error && <FormMessage type="error" message={state.error} />}
      {state?.success && <FormMessage type="success" message={state.success} />}

      <SubmitButton pendingLabel="جارٍ الحفظ..." className="w-auto px-6">
        تغيير كلمة المرور
      </SubmitButton>
    </form>
  );
}
