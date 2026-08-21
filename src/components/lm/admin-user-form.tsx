"use client";

import { useFormState } from "react-dom";
import { Input, Label, Select, FieldError } from "./ui";
import { SubmitButton } from "./submit-button";

export function AdminCreateUserForm({
  action,
}: {
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" name="name" required autoFocus />
      </div>
      <div>
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="05XXXXXXXX" dir="ltr" />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" name="password" type="password" required minLength={6} dir="ltr" />
      </div>
      <div>
        <Label htmlFor="role">الصلاحية</Label>
        <Select id="role" name="role" defaultValue="USER">
          <option value="USER">مستخدم عادي</option>
          <option value="ADMIN">مدير عام</option>
        </Select>
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>إنشاء المستخدم</SubmitButton>
    </form>
  );
}

export function AdminEditUserForm({
  action,
  defaultName,
  defaultRole,
}: {
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
  defaultName: string;
  defaultRole: string;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" name="name" required defaultValue={defaultName} />
      </div>
      <div>
        <Label htmlFor="role">الصلاحية</Label>
        <Select id="role" name="role" defaultValue={defaultRole}>
          <option value="USER">مستخدم عادي</option>
          <option value="ADMIN">مدير عام</option>
        </Select>
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>حفظ التعديلات</SubmitButton>
    </form>
  );
}
