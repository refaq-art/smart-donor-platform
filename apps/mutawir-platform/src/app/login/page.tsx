"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth-actions";
import { BrandLockup } from "@/components/brand-lockup";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLockup withTagline={false} />
        </div>
        <div className="mb-8 text-center text-sm font-medium text-navy-600">من القياس إلى الأثر</div>

        <form action={formAction} className="card space-y-4">
          <h1 className="text-lg font-bold text-slate-800">تسجيل الدخول</h1>
          {state?.error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}
          <div>
            <label className="label" htmlFor="email">البريد الإلكتروني</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="password">كلمة المرور</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 p-4 text-xs leading-relaxed text-navy-700">
          <div className="mb-1 font-semibold text-navy-800">حسابات تجريبية</div>
          admin@mutawir.sa · consultant@mutawir.sa · council@mutawir.sa · org@mutawir.sa
          <br />
          كلمة المرور للجميع: Mutawir@2026
        </div>
      </div>
    </div>
  );
}
