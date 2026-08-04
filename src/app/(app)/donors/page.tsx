import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { PageHeader, EmptyState, Badge, Pagination } from "@/components/ui-bits";
import { DONOR_TYPES, DONOR_RELATIONSHIP_STATUSES } from "@/lib/constants";
import { HandCoins, Plus, Phone, Mail } from "lucide-react";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 9;

const RELATIONSHIP_COLORS: Record<string, string> = {
  "نشط": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "محتمل": "bg-blue-50 text-blue-700 border-blue-300",
  "متوقف": "bg-slate-100 text-slate-500 border-slate-300",
};

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const page = Math.max(1, Number(sp.page || 1));

  const where: Prisma.DonorWhereInput = {};
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q } },
      { supportFields: { contains: sp.q } },
      { city: { contains: sp.q } },
    ];
  }
  if (sp.type) where.type = sp.type;
  if (sp.status) where.relationshipStatus = sp.status;

  const [donors, total] = await Promise.all([
    prisma.donor.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { opportunities: true } } },
    }),
    prisma.donor.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="الجهات المانحة"
        subtitle={`${total} جهة مسجلة`}
        action={
          canEdit(session?.role) && (
            <Link href="/donors/new" className="btn-primary">
              <Plus size={16} /> إضافة جهة مانحة
            </Link>
          )
        }
      />

      <form className="card mb-6 flex flex-wrap items-center gap-3 p-4" method="get">
        <input type="text" name="q" defaultValue={sp.q} placeholder="ابحث باسم الجهة أو المجال أو المدينة..." className="input max-w-xs flex-1" />
        <select name="type" defaultValue={sp.type || ""} className="select w-auto">
          <option value="">كل الأنواع</option>
          {DONOR_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status || ""} className="select w-auto">
          <option value="">كل الحالات</option>
          {DONOR_RELATIONSHIP_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">تصفية</button>
      </form>

      {donors.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="لا توجد جهات مانحة مطابقة"
          description="أضف الجهات المانحة لمتابعة فرص التمويل الخاصة بها."
          action={canEdit(session?.role) && <Link href="/donors/new" className="btn-primary mt-2"><Plus size={16} /> إضافة جهة</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((d) => (
            <Link key={d.id} href={`/donors/${d.id}`} className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <p className="font-black text-ink">{d.name}</p>
                <Badge label={d.relationshipStatus} colorClass={RELATIONSHIP_COLORS[d.relationshipStatus]} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.type && <Badge label={d.type} colorClass="bg-brand-50 text-brand-700 border-brand-200" />}
                {d.city && <Badge label={d.city} />}
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{d.supportFields || "لم تُحدد مجالات الدعم بعد"}</p>
              <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                <span>{d._count.opportunities} فرصة مرتبطة</span>
                <div className="flex items-center gap-2">
                  {d.phone && <Phone size={13} />}
                  {d.email && <Mail size={13} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/donors" searchParams={sp} />
    </div>
  );
}
