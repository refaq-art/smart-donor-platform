"use client";

import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import { Clock, CalendarRange } from "lucide-react";
import { Input, Label, Select, FieldError, Card } from "./ui";
import { SubmitButton } from "./submit-button";
import { createGraceTransactionAction, createInstallmentTransactionAction } from "@/app/actions/lm/transactions";
import { formatSAR } from "@/lib/lm/money";

type Customer = { id: string; name: string };

export function TransactionTypeAndForm({
  customers,
  defaultCustomerId,
}: {
  customers: Customer[];
  defaultCustomerId?: string;
}) {
  const [type, setType] = useState<"GRACE" | "INSTALLMENT" | null>(null);

  if (!type) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setType("GRACE")} className="text-right">
          <Card className="h-full transition hover:border-emerald-300 hover:shadow-md">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarRange size={24} />
            </div>
            <p className="mt-4 text-lg font-black text-slate-900">مهلة</p>
            <p className="mt-1 text-sm text-slate-500">
              يحصل العميل على مبلغ ويسدد أصل المبلغ + الفائدة دفعة واحدة عند نهاية المدة.
            </p>
          </Card>
        </button>
        <button type="button" onClick={() => setType("INSTALLMENT")} className="text-right">
          <Card className="h-full transition hover:border-emerald-300 hover:shadow-md">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock size={24} />
            </div>
            <p className="mt-4 text-lg font-black text-slate-900">أقساط</p>
            <p className="mt-1 text-sm text-slate-500">
              يُقسَّم الإجمالي على عدد من الأقساط الشهرية تُنشأ تلقائيًا.
            </p>
          </Card>
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setType(null)}
        className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        ← تغيير نوع العملية
      </button>
      <Card>
        {type === "GRACE" ? (
          <GraceForm customers={customers} defaultCustomerId={defaultCustomerId} />
        ) : (
          <InstallmentForm customers={customers} defaultCustomerId={defaultCustomerId} />
        )}
      </Card>
    </div>
  );
}

function CustomerSelect({ customers, defaultCustomerId }: { customers: Customer[]; defaultCustomerId?: string }) {
  return (
    <div>
      <Label htmlFor="customerId">العميل</Label>
      <Select id="customerId" name="customerId" required defaultValue={defaultCustomerId || ""}>
        <option value="" disabled>
          اختر العميل
        </option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

function TotalHint({ principal, interest }: { principal: string; interest: string }) {
  const total = useMemo(() => {
    const p = Number(principal) || 0;
    const i = Number(interest) || 0;
    return p + i;
  }, [principal, interest]);
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
      الإجمالي المطلوب: <span className="text-emerald-700">{formatSAR(total)}</span>
    </p>
  );
}

function GraceForm({ customers, defaultCustomerId }: { customers: Customer[]; defaultCustomerId?: string }) {
  const [state, formAction] = useFormState(createGraceTransactionAction, null);
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <CustomerSelect customers={customers} defaultCustomerId={defaultCustomerId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="principal">أصل المبلغ (ر.س)</Label>
          <Input
            id="principal"
            name="principal"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="interest">مبلغ الفائدة (ر.س)</Label>
          <Input
            id="interest"
            name="interest"
            type="number"
            min="0"
            step="0.01"
            required
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          />
        </div>
      </div>
      <TotalHint principal={principal} interest={interest} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">تاريخ البداية</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div>
          <Label htmlFor="months">عدد الأشهر</Label>
          <Input id="months" name="months" type="number" min="1" step="1" required />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Input id="notes" name="notes" />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>حفظ عملية المهلة</SubmitButton>
    </form>
  );
}

function InstallmentForm({ customers, defaultCustomerId }: { customers: Customer[]; defaultCustomerId?: string }) {
  const [state, formAction] = useFormState(createInstallmentTransactionAction, null);
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");
  const [count, setCount] = useState("");

  const perInstallment = useMemo(() => {
    const p = Number(principal) || 0;
    const i = Number(interest) || 0;
    const c = Number(count) || 0;
    if (c <= 0) return null;
    return (p + i) / c;
  }, [principal, interest, count]);

  return (
    <form action={formAction} className="space-y-4">
      <CustomerSelect customers={customers} defaultCustomerId={defaultCustomerId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="principal">أصل المبلغ (ر.س)</Label>
          <Input
            id="principal"
            name="principal"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="interest">مبلغ الفائدة (ر.س)</Label>
          <Input
            id="interest"
            name="interest"
            type="number"
            min="0"
            step="0.01"
            required
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          />
        </div>
      </div>
      <TotalHint principal={principal} interest={interest} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="installmentsCount">عدد الأقساط</Label>
          <Input
            id="installmentsCount"
            name="installmentsCount"
            type="number"
            min="1"
            step="1"
            required
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="firstInstallmentDate">تاريخ أول قسط</Label>
          <Input id="firstInstallmentDate" name="firstInstallmentDate" type="date" required />
        </div>
      </div>
      {perInstallment !== null && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          قيمة القسط تقريبًا: <span className="text-emerald-700">{formatSAR(perInstallment)}</span>
        </p>
      )}
      <div>
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Input id="notes" name="notes" />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>حفظ عملية الأقساط</SubmitButton>
    </form>
  );
}
