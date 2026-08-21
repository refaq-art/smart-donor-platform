import { requireLmSessionPage } from "@/lib/lm/authz";
import { getUserDashboard } from "@/lib/lm/queries";
import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Card, StatusBadge, TypeBadge, LinkButton, EmptyState } from "@/components/lm/ui";
import { Users, Wallet, Percent, Banknote, CircleCheck, AlertTriangle, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireLmSessionPage();
  const data = await getUserDashboard(session.userId);

  return (
    <div>
      <PageHeader
        title={`مرحبًا، ${session.name}`}
        subtitle="نظرة سريعة على عملائك ومستحقاتك"
        action={
          <LinkButton href="/installments/transactions/new">
            <PlusCircle size={18} />
            عملية جديدة
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="عدد العملاء" value={data.customersCount} icon={Users} tone="slate" />
        <StatCard label="إجمالي أصل المبالغ" value={formatSAR(data.totalPrincipal)} icon={Wallet} tone="blue" />
        <StatCard label="إجمالي الفوائد" value={formatSAR(data.totalInterest)} icon={Percent} tone="amber" />
        <StatCard label="إجمالي المطلوب" value={formatSAR(data.totalRequired)} icon={Banknote} tone="slate" />
        <StatCard label="إجمالي المحصَّل" value={formatSAR(data.totalPaid)} icon={CircleCheck} tone="emerald" />
        <StatCard label="إجمالي المتبقي" value={formatSAR(data.totalRemaining)} icon={Wallet} tone="red" />
        <StatCard label="عمليات متأخرة" value={data.lateCount} icon={AlertTriangle} tone="red" />
        <StatCard label="مستحق حاليًا" value={formatSAR(data.dueNowAmount)} icon={Clock} tone="amber" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-black text-slate-900">الاستحقاقات القادمة</h2>
          {data.upcoming.length === 0 ? (
            <EmptyState title="لا توجد استحقاقات قادمة قريبًا" />
          ) : (
            <Card className="divide-y divide-slate-100 p-0">
              {data.upcoming.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/installments/transactions/${item.transactionId}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{item.customerName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">استحقاق {formatDate(item.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold text-slate-700">{formatSAR(item.amount)}</span>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-black text-slate-900">المتأخرة</h2>
          {data.late.length === 0 ? (
            <EmptyState title="لا توجد عمليات متأخرة 🎉" description="كل مستحقاتك ضمن الوقت المحدد." />
          ) : (
            <Card className="divide-y divide-slate-100 p-0">
              {data.late.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/installments/transactions/${item.transactionId}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-red-50/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{item.customerName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <TypeBadge type={item.type} /> · استحق {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold text-red-700">{formatSAR(item.amount)}</span>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
