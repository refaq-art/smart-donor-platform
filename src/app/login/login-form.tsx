"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  { role: "مدير النظام", email: "admin@refaq.org" },
  { role: "مدير الجمعية", email: "manager@refaq.org" },
  { role: "مسؤول المنح", email: "officer@refaq.org" },
  { role: "مراجع", email: "reviewer@refaq.org" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, null);
  const [email, setEmail] = useState("");

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next || "/dashboard"} />
        <div>
          <label className="field-label" htmlFor="email">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="name@example.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="input"
            placeholder="••••••••"
            dir="ltr"
          />
        </div>
        {state?.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
        <p className="mb-2 text-xs font-bold text-brand-700">
          حسابات تجريبية (كلمة المرور للجميع: <span dir="ltr">Passw0rd!</span>)
        </p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => setEmail(a.email)}
              className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-right text-xs font-bold text-brand-700 hover:bg-brand-100"
            >
              {a.role}
              <span className="block text-[11px] font-normal text-slate-500" dir="ltr">
                {a.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
