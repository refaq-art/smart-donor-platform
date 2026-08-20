"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState<FormState, FormData>(forgotPasswordAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label className="field-label" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder="name@example.com"
          dir="ltr"
        />
        <p className="field-hint">سنرسل رابطًا لإعادة تعيين كلمة المرور إلى هذا البريد.</p>
      </div>

      {state?.error && <FormMessage type="error" message={state.error} />}
      {state?.success && <FormMessage type="success" message={state.success} />}

      <SubmitButton pendingLabel="جارٍ الإرسال...">إرسال رابط الاستعادة</SubmitButton>

      <p className="text-center text-sm text-slate-500">
        تذكّرت كلمة المرور؟{" "}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
