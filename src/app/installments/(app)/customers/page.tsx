import { requireLmSessionPage } from "@/lib/lm/authz";
import { listUserCustomers } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { PageHeader, Card, LinkButton, EmptyState } from "@/components/lm/ui";
import { SearchBar } from "@/components/lm/search-bar";
import { Users, PlusCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireLmSessionPage();
  const { q } = await searchParams;
  const customers = await listUserCustomers(session.userId, q);

  return (
    <div>
      <PageHeader
        title="العملاء"
        subtitle={`${customers.length} عميل`}
        action={
          <LinkButton href="/installments/customers/new">
            <PlusCircle size={18} />
            عميل جديد
          </LinkButton>
        }
      />

      <div className="mb-5">
        <SearchBar placeholder="بحث باسم العميل..." />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء بعد"}
          description={q ? "جرّب اسمًا آخر." : "أضف أول عميل لديك للبدء بتسجيل عملياته."}
          action={
            !q && (
              <LinkButton href="/installments/customers/new">
                <PlusCircle size={18} />
                إضافة عميل
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/installments/customers/${c.id}`}>
              <Card className="h-full transition hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-900">{c.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{c.transactionsCount} عملية</p>
                  </div>
                  <ChevronLeft size={18} className="mt-1 shrink-0 text-slate-300" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">المطلوب</p>
                    <p className="font-bold text-slate-900">{formatSAR(c.totalRequired)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">المتبقي</p>
                    <p className={c.totalRemaining > 0 ? "font-bold text-red-600" : "font-bold text-emerald-600"}>
                      {formatSAR(c.totalRemaining)}
                    </p>
                  </div>
                </div>
                {c.lateCount > 0 && (
                  <p className="mt-3 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600">
                    {c.lateCount} عملية متأخرة
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
