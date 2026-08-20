import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { formatDateShortAr, formatNumberAr } from "@/lib/utils";

export const metadata: Metadata = { title: "إدارة المستخدمين" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const where: Prisma.UserWhereInput = {};
  if (searchParams.q) {
    where.OR = [
      { fullName: { contains: searchParams.q } },
      { email: { contains: searchParams.q } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">إدارة المستخدمين</h1>
        <p className="page-subtitle">{formatNumberAr(users.length)} مستخدم</p>
      </div>

      <form method="get" action="/admin/users" className="card mb-6 flex items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            className="input pr-10"
          />
        </div>
        <button type="submit" className="btn-secondary">
          بحث
        </button>
      </form>

      {users.length === 0 ? (
        <EmptyState title="لا يوجد مستخدمون مطابقون" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد الإلكتروني</th>
                <th className="px-4 py-3">تاريخ التسجيل</th>
                <th className="px-4 py-3">عدد الدورات</th>
                <th className="px-4 py-3">الصلاحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-bold text-ink">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateShortAr(user.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatNumberAr(user._count.enrollments)}</td>
                  <td className="px-4 py-3">
                    {user.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        مسؤول
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        مستخدم
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
