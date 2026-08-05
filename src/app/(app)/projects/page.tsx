import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { canEdit } from "@/lib/roles";
import { PageHeader, EmptyState, Badge, Pagination, ProgressBar } from "@/components/ui-bits";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, PROJECT_STATUS_COLORS } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/utils";
import { FolderKanban, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 9;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireSession();
  const page = Math.max(1, Number(sp.page || 1));

  const where: Prisma.ProjectWhereInput = { organizationId: session!.organizationId };
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { problemStatement: { contains: sp.q } },
      { geographicScope: { contains: sp.q } },
    ];
  }
  if (sp.category) where.category = sp.category;
  if (sp.status) where.status = sp.status;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { applications: true, opportunities: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="المشاريع"
        subtitle={`${total} مشروعًا مسجلًا`}
        action={
          canEdit(session?.role) && (
            <Link href="/projects/new" className="btn-primary">
              <Plus size={16} /> مشروع جديد
            </Link>
          )
        }
      />

      <form className="card mb-6 flex flex-wrap items-center gap-3 p-4" method="get">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="ابحث باسم المشروع أو المشكلة أو النطاق الجغرافي..."
          className="input max-w-xs flex-1"
        />
        <select name="category" defaultValue={sp.category || ""} className="select w-auto">
          <option value="">كل الفئات</option>
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status || ""} className="select w-auto">
          <option value="">كل الحالات</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          تصفية
        </button>
      </form>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="لا توجد مشاريع مطابقة"
          description="ابدأ بإنشاء مشروعك الأول لإدارة تفاصيله وربطه بفرص التمويل وطلبات المنح."
          action={
            canEdit(session?.role) && (
              <Link href="/projects/new" className="btn-primary mt-2">
                <Plus size={16} /> إنشاء مشروع
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const budgetSpent = 0;
            const budgetPercent = p.budgetTotal ? Math.min(100, (budgetSpent / p.budgetTotal) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-ink">{p.title}</p>
                  <Badge label={p.status} colorClass={PROJECT_STATUS_COLORS[p.status]} />
                </div>
                {p.category && <Badge label={p.category} colorClass="bg-brand-50 text-brand-700 border-brand-200" />}
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {p.problemStatement || "لا يوجد وصف للمشكلة بعد"}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <p className="font-bold text-ink">{formatMoney(p.budgetTotal)}</p>
                    <p>الميزانية</p>
                  </div>
                  <div>
                    <p className="font-bold text-ink">{p._count.applications} طلب</p>
                    <p>{p._count.opportunities} فرصة مرتبطة</p>
                  </div>
                </div>
                <ProgressBar percent={budgetPercent} />
                <p className="mt-auto text-[11px] text-slate-400">آخر تحديث: {formatDate(p.updatedAt)}</p>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/projects" searchParams={sp} />
    </div>
  );
}
