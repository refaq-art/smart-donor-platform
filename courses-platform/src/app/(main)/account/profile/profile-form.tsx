"use client";

import { useFormState } from "react-dom";
import { updateProfileAction } from "@/app/actions/profile";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label className="field-label" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input id="email" type="email" value={email} disabled className="input bg-slate-50 text-slate-400" dir="ltr" />
        <p className="field-hint">لا يمكن تغيير البريد الإلكتروني حاليًا.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="fullName">
          الاسم الكامل
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          minLength={3}
          defaultValue={fullName}
          className="input"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="phone">
          رقم الجوال <span className="font-normal text-slate-400">(اختياري)</span>
        </label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} className="input" dir="ltr" />
      </div>

      {state?.error && <FormMessage type="error" message={state.error} />}
      {state?.success && <FormMessage type="success" message={state.success} />}

      <SubmitButton pendingLabel="جارٍ الحفظ..." className="w-auto px-6">
        حفظ التعديلات
      </SubmitButton>
    </form>
  );
}
