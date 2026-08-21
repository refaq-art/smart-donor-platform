"use client";

import { useFormState } from "react-dom";
import { Input, Label, FieldError } from "./ui";
import { SubmitButton } from "./submit-button";

export function CustomerForm({
  action,
  defaultName,
}: {
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
  defaultName?: string;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم العميل</Label>
        <Input id="name" name="name" required defaultValue={defaultName} placeholder="مثال: محمد العتيبي" autoFocus />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>حفظ</SubmitButton>
    </form>
  );
}
