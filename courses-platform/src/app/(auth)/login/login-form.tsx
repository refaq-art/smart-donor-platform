"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next || ""} />

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
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="field-label" htmlFor="password">
            كلمة المرور
          </label>
          <Link href="/forgot-password" className="mb-1.5 text-xs font-bold text-brand-600 hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          placeholder="••••••••"
          dir="ltr"
        />
      </div>

      {state?.error && <FormMessage type="error" message={state.error} />}

      <SubmitButton pendingLabel="جارٍ الدخول...">تسجيل الدخول</SubmitButton>

      <p className="text-center text-sm text-slate-500">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-brand-600 hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </form>
  );
}
