import { notFound } from "next/navigation";
import { adminGetUser, adminGetUserData } from "@/lib/lm/admin";
import { adminUpdateUserAction, adminDeleteUserAction } from "@/app/actions/lm/admin";
import { formatSaudiPhone } from "@/lib/lm/validation";
import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card, StatCard, StatusBadge, TypeBadge, EmptyState } from "@/components/lm/ui";
import { AdminEditUserForm } from "@/components/lm/admin-user-form";
import { ToggleActiveButton } from "@/components/lm/admin-toggle-active";
import { ConfirmDeleteButton } from "@/components/lm/confirm-delete-button";
import { Users, Receipt } from "lucide-react";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await adminGetUser(id);
  if (!user) notFound();

  const { dashboard, customers, transactions } = await adminGetUserData(id);

  return (
    <div>
      <PageHeader
        title={user.name}
        subtitle={formatSaudiPhone(user.phone)}
        action={
          <>
            <ToggleActiveButton userId={user.id} isActive={user.isActive} />
            <ConfirmDeleteButton
              label="حذف المستخدم"
              title="حذف المستخدم"
              description={`سيؤدي حذف "${user.name}" إلى حذف كل عملائه وعملياته وأقساطه ودفعاته نهائيًا. هل أنت متأكد؟`}
              onConfirm={adminDeleteUserAction.bind(null, user.id)}
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-base font-black text-slate-900">تعديل البيانات</h2>
          <AdminEditUserForm
            action={adminUpdateUserAction.bind(null, user.id)}
            defaultName={user.name}
            defaultRole={user.role}
          />
          <p className="mt-4 text-xs text-slate-400">عضو منذ {formatDate(user.createdAt)}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard label="عدد العملاء" value={dashboard.customersCount} icon={Users} tone="slate" />
          <StatCard label="إجمالي المطلوب" value={formatSAR(dashboard.totalRequired)} tone="blue" />
          <StatCard label="إجمالي المحصَّل" value={formatSAR(dashboard.totalPaid)} tone="emerald" />
          <StatCard label="إجمالي المتبقي" value={formatSAR(dashboard.totalRemaining)} tone="red" />
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">العملاء ({customers.length})</h2>
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد عملاء لهذا المستخدم" />
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <p className="font-bold text-slate-900">{c.name}</p>
              <span className="text-sm text-slate-500">
                المتبقي {formatSAR(c.totalRemaining)} · {c.transactionsCount} عملية
              </span>
            </div>
          ))}
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-lg font-black text-slate-900">العمليات ({transactions.length})</h2>
      {transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="لا توجد عمليات لهذا المستخدم" />
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {transactions.map((t) => (
            <div key={t.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <TypeBadge type={t.type} />
                <span className="font-bold text-slate-900">{t.customer.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">المتبقي {formatSAR(t.remaining)}</span>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
