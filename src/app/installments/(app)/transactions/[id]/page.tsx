import { requireLmSessionPage } from "@/lib/lm/authz";
import { getUserTransactionDetail } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card, StatCard, LinkButton, StatusBadge, TypeBadge } from "@/components/lm/ui";
import { InstallmentTable } from "@/components/lm/installment-table";
import { ConfirmDeleteButton } from "@/components/lm/confirm-delete-button";
import { deleteTransactionAction } from "@/app/actions/lm/transactions";
import { deletePaymentAction } from "@/app/actions/lm/payments";
import { Banknote, User } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireLmSessionPage();
  const { id } = await params;
  const transaction = await getUserTransactionDetail(id, session.userId);
  if (!transaction) notFound();

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <TypeBadge type={transaction.type} />
            <span>عملية {transaction.customer.name}</span>
          </span>
        }
        subtitle={`أُنشئت في ${formatDate(transaction.createdAt)}`}
        action={
          <>
            <LinkButton href={`/installments/payments/new?transactionId=${transaction.id}`}>
              <Banknote size={18} />
              تسجيل دفعة
            </LinkButton>
            <ConfirmDeleteButton
              label="حذف العملية"
              title="حذف العملية"
              description="سيؤدي حذف هذه العملية إلى حذف كل أقساطها ودفعاتها نهائيًا. هل أنت متأكد؟"
              onConfirm={deleteTransactionAction.bind(null, transaction.id)}
            />
          </>
        }
      />

      <Link
        href={`/installments/customers/${transaction.customer.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:underline"
      >
        <User size={15} />
        {transaction.customer.name}
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="أصل المبلغ" value={formatSAR(transaction.principal)} tone="blue" />
        <StatCard label="الفائدة" value={formatSAR(transaction.interest)} tone="amber" />
        <StatCard label="الإجمالي" value={formatSAR(transaction.totalAmount)} tone="slate" />
        <StatCard label="المدفوع" value={formatSAR(transaction.paidAmount)} tone="emerald" />
        <StatCard
          label="المتبقي"
          value={formatSAR(transaction.remaining)}
          tone={transaction.remaining > 0 ? "red" : "emerald"}
        />
        <StatCard label="الحالة" value={<StatusBadge status={transaction.status} />} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
        <span>تاريخ البداية: {formatDate(transaction.startDate)}</span>
        {transaction.dueDate && <span>تاريخ الاستحقاق: {formatDate(transaction.dueDate)}</span>}
        {transaction.notes && <span>ملاحظات: {transaction.notes}</span>}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">
        {transaction.type === "GRACE" ? "تفاصيل الاستحقاق" : "جدول الأقساط"}
      </h2>
      <InstallmentTable rows={transaction.installments} />

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">سجل الدفعات</h2>
      {transaction.payments.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">لا توجد دفعات مسجَّلة على هذه العملية بعد.</Card>
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {transaction.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-slate-500">{formatDate(p.paymentDate)}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700">{formatSAR(p.amount)}</span>
                <ConfirmDeleteButton
                  compact
                  label="حذف"
                  title="حذف الدفعة"
                  description="سيتم عكس أثر هذه الدفعة عن الأقساط وإجمالي العملية. هل أنت متأكد؟"
                  onConfirm={deletePaymentAction.bind(null, p.id, transaction.id)}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
