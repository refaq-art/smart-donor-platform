"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSAR } from "@/lib/lm/money";
import { Label, Select, Button, Card } from "./ui";

type TransactionOption = {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  remaining: number;
};

export function PaymentPicker({ transactions }: { transactions: TransactionOption[] }) {
  const router = useRouter();
  const customers = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of transactions) map.set(t.customerId, t.customerName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const options = transactions.filter((t) => t.customerId === customerId);
  const [transactionId, setTransactionId] = useState(options[0]?.id || "");

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const first = transactions.find((t) => t.customerId === id);
    setTransactionId(first?.id || "");
  }

  return (
    <Card className="space-y-4">
      <div>
        <Label htmlFor="customerPick">العميل</Label>
        <Select id="customerPick" value={customerId} onChange={(e) => handleCustomerChange(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="transactionPick">العملية</Label>
        <Select id="transactionPick" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.type === "GRACE" ? "مهلة" : "أقساط"} — متبقي {formatSAR(t.remaining)}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={!transactionId}
        onClick={() => router.push(`/installments/payments/new?transactionId=${transactionId}`)}
      >
        متابعة
      </Button>
    </Card>
  );
}
