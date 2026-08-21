import { requireLmSessionPage } from "@/lib/lm/authz";
import { listUserTransactions } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { STATUS_FILTER_OPTIONS } from "@/lib/lm/status";
import { PageHeader, Card, LinkButton, StatusBadge, TypeBadge, EmptyState } from "@/components/lm/ui";
import { SearchBar, FilterChips } from "@/components/lm/search-bar";
import { Receipt, PlusCircle } from "lucide-react";
import Link from "next/link";

const TYPE_OPTIONS = [
  { value: "ALL", label: "الكل" },
  { value: "GRACE", label: "مهلة" },
  { value: "INSTALLMENT", label: "أقساط" },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const session = await requireLmSessionPage();
  const { q, type, status } = await searchParams;
  const transactions = await listUserTransactions(session.userId, { search: q, type, status });

  return (
    <div>
      <PageHeader
        title="العمليات"
        subtitle={`${transactions.length} عملية`}
        action={
          <LinkButton href="/installments/transactions/new">
            <PlusCircle size={18} />
            عملية جديدة
          </LinkButton>
        }
      />

      <div className="mb-4 space-y-3">
        <SearchBar placeholder="بحث باسم العميل..." />
        <FilterChips options={TYPE_OPTIONS} paramName="type" />
        <FilterChips options={STATUS_FILTER_OPTIONS} paramName="status" />
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="لا توجد عمليات مطابقة"
          description="جرّب تغيير الفلاتر، أو أضف عملية جديدة."
          action={
            <LinkButton href="/installments/transactions/new">
              <PlusCircle size={18} />
              عملية جديدة
            </LinkButton>
          }
        />
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {transactions.map((t) => (
            <Link
              key={t.id}
              href={`/installments/transactions/${t.id}`}
              className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-black text-slate-900">{t.customer.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <TypeBadge type={t.type} />
                  <span className="text-xs text-slate-400">
                    {t.dueDate ? `استحقاق ${formatDate(t.dueDate)}` : "—"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-left">
                  <p className="text-xs text-slate-400">المتبقي</p>
                  <p className="font-bold text-slate-900">{formatSAR(t.remaining)}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
