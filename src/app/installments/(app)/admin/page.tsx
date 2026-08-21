import { adminGetOverview } from "@/lib/lm/admin";
import { PageHeader, StatCard } from "@/components/lm/ui";
import { Users, UserCheck, UserX, Contact, Receipt } from "lucide-react";

export default async function AdminOverviewPage() {
  const overview = await adminGetOverview();

  return (
    <div>
      <PageHeader title="لوحة الإدارة" subtitle="نظرة عامة على كل حسابات النظام" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي المستخدمين" value={overview.totalUsers} icon={Users} tone="slate" />
        <StatCard label="مستخدمون نشطون" value={overview.activeUsers} icon={UserCheck} tone="emerald" />
        <StatCard label="مستخدمون معطَّلون" value={overview.disabledUsers} icon={UserX} tone="red" />
        <StatCard label="إجمالي العملاء" value={overview.totalCustomers} icon={Contact} tone="blue" />
        <StatCard label="إجمالي العمليات" value={overview.totalTransactions} icon={Receipt} tone="amber" />
      </div>
    </div>
  );
}
