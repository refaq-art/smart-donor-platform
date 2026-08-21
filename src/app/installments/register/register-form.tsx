"use client";

import { useFormState } from "react-dom";
import { registerAction, type LmFormState } from "@/app/actions/lm/auth";
import { Input, Label, FieldError } from "@/components/lm/ui";
import { SubmitButton } from "@/components/lm/submit-button";

export default function RegisterForm() {
  const [state, formAction] = useFormState<LmFormState, FormData>(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" name="name" required placeholder="اسمك الكامل" />
      </div>
      <div>
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="05XXXXXXXX" dir="ltr" />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="6 أحرف على الأقل"
          dir="ltr"
        />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton pendingText="جارٍ الإنشاء...">إنشاء الحساب</SubmitButton>
    </form>
  );
}
