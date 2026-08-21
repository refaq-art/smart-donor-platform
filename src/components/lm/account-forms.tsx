"use client";

import { useFormState } from "react-dom";
import { updateAccountAction, changePasswordAction } from "@/app/actions/lm/account";
import { Input, Label, FieldError, Card } from "./ui";
import { SubmitButton } from "./submit-button";

export function UpdateNameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useFormState(updateAccountAction, null);

  return (
    <Card>
      <h2 className="mb-4 text-base font-black text-slate-900">الاسم</h2>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" name="name" required defaultValue={defaultName} />
        </div>
        <FieldError message={state?.error} />
        {state?.success && <p className="text-sm font-bold text-emerald-600">تم الحفظ بنجاح.</p>}
        <SubmitButton>حفظ</SubmitButton>
      </form>
    </Card>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, null);

  return (
    <Card>
      <h2 className="mb-4 text-base font-black text-slate-900">كلمة المرور</h2>
      <form action={formAction} className="space-y-4" key={state?.success ? "reset" : "form"}>
        <div>
          <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required dir="ltr" />
        </div>
        <div>
          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
          <Input id="newPassword" name="newPassword" type="password" required minLength={6} dir="ltr" />
        </div>
        <div>
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} dir="ltr" />
        </div>
        <FieldError message={state?.error} />
        {state?.success && <p className="text-sm font-bold text-emerald-600">تم تغيير كلمة المرور بنجاح.</p>}
        <SubmitButton>تغيير كلمة المرور</SubmitButton>
      </form>
    </Card>
  );
}
