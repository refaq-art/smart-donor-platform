"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { recordPaymentAction } from "@/app/actions/lm/payments";
import { Input, Label, FieldError } from "./ui";
import { SubmitButton } from "./submit-button";

export function PaymentForm({ transactionId }: { transactionId: string }) {
  const boundAction = recordPaymentAction.bind(null, transactionId);
  const [state, formAction] = useFormState(boundAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push(`/installments/transactions/${transactionId}`);
      router.refresh();
    }
  }, [state, router, transactionId]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="amount">مبلغ الدفعة (ر.س)</Label>
        <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required autoFocus />
      </div>
      <div>
        <Label htmlFor="paymentDate">تاريخ الدفعة</Label>
        <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={today} />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>حفظ الدفعة</SubmitButton>
    </form>
  );
}
