import { requireLmSessionPage } from "@/lib/lm/authz";
import { getUserTransactionDetail, listUserTransactions } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { PageHeader, Card, LinkButton, EmptyState } from "@/components/lm/ui";
import { PaymentPicker } from "@/components/lm/payment-picker";
import { PaymentForm } from "@/components/lm/payment-form";
import { Receipt } from "lucide-react";
import { notFound } from "next/navigation";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ transactionId?: string }>;
}) {
  const session = await requireLmSessionPage();
  const { transactionId } = await searchParams;

  if (transactionId) {
    const transaction = await getUserTransactionDetail(transactionId, session.userId);
    if (!transaction) notFound();

    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="تسجيل دفعة" subtitle={transaction.customer.name} />
        <Card className="mb-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">المتبقي على العملية</span>
          <span className="font-black text-slate-900">{formatSAR(transaction.remaining)}</span>
        </Card>
        <Card>
          <PaymentForm transactionId={transaction.id} />
        </Card>
      </div>
    );
  }

  const unpaid = await listUserTransactions(session.userId, { status: "UNPAID" });
  if (unpaid.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="تسجيل دفعة" />
        <EmptyState
          icon={Receipt}
          title="لا توجد عمليات غير مسددة"
          description="كل العمليات مسددة بالكامل حاليًا."
          action={<LinkButton href="/installments/transactions">عرض العمليات</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="تسجيل دفعة" subtitle="اختر العميل ثم العملية" />
      <PaymentPicker
        transactions={unpaid.map((t) => ({
          id: t.id,
          customerId: t.customerId,
          customerName: t.customer.name,
          type: t.type,
          remaining: t.remaining,
        }))}
      />
    </div>
  );
}
