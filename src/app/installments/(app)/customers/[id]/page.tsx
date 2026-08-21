import { requireLmSessionPage } from "@/lib/lm/authz";
import { getUserCustomerDetail } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card, StatCard, LinkButton, StatusBadge, TypeBadge, EmptyState } from "@/components/lm/ui";
import { ConfirmDeleteButton } from "@/components/lm/confirm-delete-button";
import { deleteCustomerAction } from "@/app/actions/lm/customers";
import { Pencil, PlusCircle, Receipt } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireLmSessionPage();
  const { id } = await params;
  const customer = await getUserCustomerDetail(id, session.userId);
  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={`عميل منذ ${formatDate(customer.createdAt)}`}
        action={
          <>
            <LinkButton href={`/installments/transactions/new?customerId=${customer.id}`}>
              <PlusCircle size={18} />
              عملية جديدة
            </LinkButton>
            <LinkButton href={`/installments/customers/${customer.id}/edit`} variant="secondary">
              <Pencil size={16} />
              تعديل
            </LinkButton>
            <ConfirmDeleteButton
              label="حذف العميل"
              title="حذف العميل"
              description={`سيؤدي حذف "${customer.name}" إلى حذف كل عملياته وأقساطه ودفعاته نهائيًا. هل أنت متأكد؟`}
              onConfirm={deleteCustomerAction.bind(null, customer.id)}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="أصل المبالغ" value={formatSAR(customer.totalPrincipal)} tone="blue" />
        <StatCard label="الفوائد" value={formatSAR(customer.totalInterest)} tone="amber" />
        <StatCard label="الإجمالي المطلوب" value={formatSAR(customer.totalRequired)} tone="slate" />
        <StatCard label="المدفوع" value={formatSAR(customer.totalPaid)} tone="emerald" />
        <StatCard
          label="المتبقي"
          value={formatSAR(customer.totalRemaining)}
          tone={customer.totalRemaining > 0 ? "red" : "emerald"}
        />
        <StatCard label="عمليات متأخرة" value={customer.lateCount} tone="red" />
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
        <span>نشطة: {customer.activeCount}</span>
        <span>مسددة: {customer.paidCount}</span>
        <span>متأخرة: {customer.lateCount}</span>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">سجل العمليات</h2>
      {customer.transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="لا توجد عمليات بعد"
          description="أضف أول عملية مهلة أو أقساط لهذا العميل."
          action={
            <LinkButton href={`/installments/transactions/new?customerId=${customer.id}`}>
              <PlusCircle size={18} />
              عملية جديدة
            </LinkButton>
          }
        />
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {customer.transactions.map((t) => (
            <Link
              key={t.id}
              href={`/installments/transactions/${t.id}`}
              className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <TypeBadge type={t.type} />
                <span className="text-sm text-slate-500">
                  {t.dueDate ? `استحقاق ${formatDate(t.dueDate)}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">المطلوب {formatSAR(t.totalAmount)}</span>
                <span className="font-bold text-slate-900">المتبقي {formatSAR(t.remaining)}</span>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">سجل الدفعات</h2>
      {customer.payments.length === 0 ? (
        <EmptyState title="لا توجد دفعات مسجَّلة بعد" />
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {customer.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <TypeBadge type={p.transactionType} />
                <span className="text-sm text-slate-500">{formatDate(p.paymentDate)}</span>
              </div>
              <span className="font-bold text-emerald-700">{formatSAR(p.amount)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
