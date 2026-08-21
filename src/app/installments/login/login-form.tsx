"use client";

import { useFormState } from "react-dom";
import { loginAction, type LmFormState } from "@/app/actions/lm/auth";
import { Input, Label, FieldError } from "@/components/lm/ui";
import { SubmitButton } from "@/components/lm/submit-button";

export default function LoginForm() {
  const [state, formAction] = useFormState<LmFormState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="05XXXXXXXX" dir="ltr" />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" name="password" type="password" required placeholder="••••••••" dir="ltr" />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton pendingText="جارٍ الدخول...">تسجيل الدخول</SubmitButton>
    </form>
  );
}
