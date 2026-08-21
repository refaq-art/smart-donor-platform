import { adminListUsers } from "@/lib/lm/admin";
import { formatSaudiPhone } from "@/lib/lm/validation";
import { PageHeader, Card, LinkButton } from "@/components/lm/ui";
import { SearchBar } from "@/components/lm/search-bar";
import { ToggleActiveButton } from "@/components/lm/admin-toggle-active";
import { UserPlus, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await adminListUsers(q);

  return (
    <div>
      <PageHeader
        title="المستخدمون"
        subtitle={`${users.length} مستخدم`}
        action={
          <LinkButton href="/installments/admin/users/new">
            <UserPlus size={18} />
            إنشاء مستخدم
          </LinkButton>
        }
      />

      <div className="mb-5">
        <SearchBar placeholder="بحث بالاسم أو رقم الجوال..." />
      </div>

      <Card className="divide-y divide-slate-100 p-0">
        {users.map((u) => (
          <div key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/installments/admin/users/${u.id}`} className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-black text-slate-900">
                  {u.name}
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                      مدير
                    </span>
                  )}
                  {!u.isActive && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      معطَّل
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400" dir="ltr">
                  {formatSaudiPhone(u.phone)}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {u._count.customers} عميل · {u._count.transactions} عملية
              </span>
              <ToggleActiveButton userId={u.id} isActive={u.isActive} />
              <Link href={`/installments/admin/users/${u.id}`} className="text-slate-300">
                <ChevronLeft size={18} />
              </Link>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
