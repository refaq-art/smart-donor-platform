import Link from "next/link";
import { requireLmAdminPage } from "@/lib/lm/authz";

export default async function LmAdminLayout({ children }: { children: React.ReactNode }) {
  await requireLmAdminPage();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <Link href="/installments/admin" className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
          نظرة عامة
        </Link>
        <Link
          href="/installments/admin/users"
          className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
        >
          المستخدمون
        </Link>
        <Link
          href="/installments/dashboard"
          className="mr-auto rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
        >
          العودة لحسابي
        </Link>
      </div>
      {children}
    </div>
  );
}
