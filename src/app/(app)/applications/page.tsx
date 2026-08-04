import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { PageHeader, EmptyState, Badge, Pagination, ProgressBar } from "@/components/ui-bits";
import { APPLICATION_STATUSES, STATUS_COLORS } from "@/lib/constants";
import { computeCompletion } from "@/lib/completion";
import { formatDate } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const page = Math.max(1, Number(sp.page || 1));

  const where: Prisma.GrantApplicationWhereInput = {};
  if (sp.q) where.title = { contains: sp.q };
  if (sp.status) where.status = sp.status;

  const [applications, total] = await Promise.all([
    prisma.grantApplication.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { project: true, opportunity: { include: { donor: true } }, assignedTo: true },
    }),
    prisma.grantApplication.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="طلبات المنح"
        subtitle={`${total} طلبًا`}
        action={
          canEdit(session?.role) && (
            <Link href="/applications/new" className="btn-primary">
              <Plus size={16} /> طلب جديد
            </Link>
          )
        }
      />

      <form className="card mb-6 flex flex-wrap items-center gap-3 p-4" method="get">
        <input type="text" name="q" defaultValue={sp.q} placeholder="ابحث بعنوان الطلب..." className="input max-w-xs flex-1" />
        <select name="status" defaultValue={sp.status || ""} className="select w-auto">
          <option value="">كل الحالات</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">تصفية</button>
      </form>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد طلبات منح مطابقة"
          description="أنشئ طلب منحة مرتبطًا بأحد مشاريعك وابدأ تعبئته خطوة بخطوة."
          action={canEdit(session?.role) && <Link href="/applications/new" className="btn-primary mt-2"><Plus size={16} /> طلب جديد</Link>}
        />
      ) : (
        <div className="card overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3 text-right">عنوان الطلب</th>
                <th className="p-3 text-right">المشروع</th>
                <th className="p-3 text-right">الجهة المانحة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">نسبة الاكتمال</th>
                <th className="p-3 text-right">آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                const { percent } = computeCompletion(a);
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-brand-50/40">
                    <td className="p-3">
                      <Link href={`/applications/${a.id}`} className="font-bold text-brand-700 hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="p-3 text-slate-500">{a.project?.title || "—"}</td>
                    <td className="p-3 text-slate-500">{a.opportunity?.donor?.name || a.opportunity?.donorNameFreeText || "—"}</td>
                    <td className="p-3">
                      <Badge label={a.status} colorClass={STATUS_COLORS[a.status]} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20"><ProgressBar percent={percent} /></div>
                        <span className="text-xs font-bold text-slate-500">{percent}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-400">{formatDate(a.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/applications" searchParams={sp} />
    </div>
  );
}
