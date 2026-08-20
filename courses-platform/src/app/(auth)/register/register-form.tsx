"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";

export default function RegisterForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(registerAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next || ""} />

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
          autoComplete="name"
          className="input"
          placeholder="مثال: أحمد محمد"
        />
      </div>

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
        <label className="field-label" htmlFor="phone">
          رقم الجوال <span className="font-normal text-slate-400">(اختياري)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="input"
          placeholder="05xxxxxxxx"
          dir="ltr"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          كلمة المرور
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

      {state?.error && <FormMessage type="error" message={state.error} />}

      <SubmitButton pendingLabel="جارٍ إنشاء الحساب...">إنشاء حساب</SubmitButton>

      <p className="text-center text-sm text-slate-500">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
