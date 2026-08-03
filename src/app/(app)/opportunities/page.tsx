import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { PageHeader, EmptyState, Badge, Pagination } from "@/components/ui-bits";
import { OPPORTUNITY_STATUSES, OPPORTUNITY_STATUS_COLORS } from "@/lib/constants";
import { formatMoney, formatDate, daysUntil } from "@/lib/utils";
import { Target, Plus, Clock } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const page = Math.max(1, Number(sp.page || 1));

  const where: Prisma.FundingOpportunityWhereInput = {};
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { field: { contains: sp.q } },
      { donorNameFreeText: { contains: sp.q } },
    ];
  }
  if (sp.status) where.status = sp.status;

  const orderBy: Prisma.FundingOpportunityOrderByWithRelationInput =
    sp.sort === "amount" ? { expectedAmount: "desc" } : sp.sort === "title" ? { title: "asc" } : { deadline: "asc" };

  const [opportunities, total] = await Promise.all([
    prisma.fundingOpportunity.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { donor: true, project: true },
    }),
    prisma.fundingOpportunity.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="فرص التمويل"
        subtitle={`${total} فرصة مسجلة`}
        action={
          canEdit(session?.role) && (
            <Link href="/opportunities/new" className="btn-primary">
              <Plus size={16} /> فرصة جديدة
            </Link>
          )
        }
      />

      <form className="card mb-6 flex flex-wrap items-center gap-3 p-4" method="get">
        <input type="text" name="q" defaultValue={sp.q} placeholder="ابحث بعنوان الفرصة أو المجال أو الجهة..." className="input max-w-xs flex-1" />
        <select name="status" defaultValue={sp.status || ""} className="select w-auto">
          <option value="">كل الحالات</option>
          {OPPORTUNITY_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sp.sort || "deadline"} className="select w-auto">
          <option value="deadline">الترتيب حسب: الأقرب موعدًا</option>
          <option value="amount">الترتيب حسب: القيمة</option>
          <option value="title">الترتيب حسب: الاسم</option>
        </select>
        <button type="submit" className="btn-secondary">تصفية</button>
      </form>

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Target}
          title="لا توجد فرص تمويل مطابقة"
          description="سجّل فرص التمويل التي رصدتها لمتابعتها وربطها بمشاريعكم."
          action={canEdit(session?.role) && <Link href="/opportunities/new" className="btn-primary mt-2"><Plus size={16} /> إضافة فرصة</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o) => {
            const days = daysUntil(o.deadline);
            const urgent = days !== null && days <= 14 && days >= 0 && o.status !== "مغلقة";
            return (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-ink">{o.title}</p>
                  <Badge label={o.status} colorClass={OPPORTUNITY_STATUS_COLORS[o.status]} />
                </div>
                <p className="text-xs font-bold text-brand-600">{o.donor?.name || o.donorNameFreeText || "جهة غير محددة"}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <p className="font-bold text-ink">{formatMoney(o.expectedAmount)}</p>
                    <p>القيمة المتوقعة</p>
                  </div>
                  <div>
                    <p className="font-bold text-ink">{o.field || "—"}</p>
                    <p>المجال</p>
                  </div>
                </div>
                {o.project && <p className="text-[11px] text-slate-400">مرتبطة بمشروع: {o.project.title}</p>}
                <div
                  className={cn(
                    "mt-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
                    urgent ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"
                  )}
                >
                  <Clock size={12} />
                  {o.deadline ? `الموعد النهائي: ${formatDate(o.deadline)}` : "بدون موعد نهائي محدد"}
                  {urgent && ` — باقي ${days} يومًا`}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/opportunities" searchParams={sp} />
    </div>
  );
}
