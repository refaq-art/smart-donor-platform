import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { PageHeader, StatCard, Badge, EmptyState, ProgressBar } from "@/components/ui-bits";
import { STATUS_COLORS, OPPORTUNITY_STATUS_COLORS } from "@/lib/constants";
import { computeCompletion } from "@/lib/completion";
import { formatDate, daysUntil } from "@/lib/utils";
import { FolderKanban, Target, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const orgWhere = { organizationId: session.organizationId };

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);

  const [
    projectCount,
    openOpportunities,
    draftApps,
    sentApps,
    acceptedApps,
    rejectedApps,
    upcomingDeadlines,
    inProgressApps,
    recentApplications,
  ] = await Promise.all([
    prisma.project.count({ where: orgWhere }),
    prisma.fundingOpportunity.count({ where: { ...orgWhere, status: "مفتوحة" } }),
    prisma.grantApplication.count({ where: { ...orgWhere, status: { in: ["مسودة", "تحت المراجعة الداخلية", "جاهز للإرسال"] } } }),
    prisma.grantApplication.count({ where: { ...orgWhere, status: "تم الإرسال" } }),
    prisma.grantApplication.count({ where: { ...orgWhere, status: "مقبول" } }),
    prisma.grantApplication.count({ where: { ...orgWhere, status: "مرفوض" } }),
    prisma.fundingOpportunity.findMany({
      where: { ...orgWhere, status: { not: "مغلقة" }, deadline: { gte: now, lte: soon } },
      orderBy: { deadline: "asc" },
      take: 6,
      include: { donor: true },
    }),
    prisma.grantApplication.findMany({
      where: { ...orgWhere, status: { notIn: ["مقبول", "مرفوض", "مؤجل"] } },
      include: { project: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.grantApplication.findMany({
      where: orgWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { project: true },
    }),
  ]);

  const totalDecided = acceptedApps + rejectedApps;
  const acceptanceRate = totalDecided > 0 ? Math.round((acceptedApps / totalDecided) * 100) : null;

  const incompleteApps = inProgressApps
    .map((a) => ({ app: a, completion: computeCompletion(a) }))
    .filter((x) => x.completion.percent < 100);

  return (
    <div>
      <PageHeader title={`مرحبًا، ${session?.name}`} subtitle="نظرة عامة على المشاريع وفرص التمويل والطلبات" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="المشاريع" value={projectCount} icon={FolderKanban} tone="brand" />
        <StatCard label="فرص تمويل متاحة" value={openOpportunities} icon={Target} tone="gold" />
        <StatCard label="طلبات قيد الإعداد" value={draftApps} icon={FileText} tone="blue" />
        <StatCard label="طلبات مرسلة" value={sentApps} icon={Clock} tone="brand" />
        <StatCard label="طلبات مقبولة" value={acceptedApps} icon={CheckCircle2} tone="brand" />
        <StatCard label="طلبات مرفوضة" value={rejectedApps} icon={XCircle} tone="red" />
        <StatCard
          label="نسبة القبول"
          value={acceptanceRate !== null ? `${acceptanceRate}%` : "—"}
          hint="من الطلبات المحسومة (مقبول/مرفوض)"
          icon={CheckCircle2}
          tone="gold"
        />
        <StatCard label="مواعيد قريبة (14 يومًا)" value={upcomingDeadlines.length} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-ink">المواعيد النهائية القريبة</p>
            <Link href="/opportunities" className="text-xs font-bold text-brand-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState icon={Clock} title="لا توجد مواعيد نهائية قريبة" />
          ) : (
            <ul className="space-y-2">
              {upcomingDeadlines.map((o) => {
                const days = daysUntil(o.deadline);
                return (
                  <li key={o.id}>
                    <Link href={`/opportunities/${o.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50">
                      <div>
                        <p className="font-bold text-ink">{o.title}</p>
                        <p className="text-xs text-slate-400">{o.donor?.name || o.donorNameFreeText || "—"}</p>
                      </div>
                      <div className="text-left">
                        <Badge label={o.status} colorClass={OPPORTUNITY_STATUS_COLORS[o.status]} />
                        <p className="mt-1 text-[11px] font-bold text-red-600">باقي {days} يومًا</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-ink">تنبيهات المعلومات الناقصة</p>
            <Link href="/applications" className="text-xs font-bold text-brand-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          {incompleteApps.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="جميع الطلبات النشطة مكتملة البيانات" />
          ) : (
            <ul className="space-y-3">
              {incompleteApps.slice(0, 6).map(({ app, completion }) => (
                <li key={app.id}>
                  <Link href={`/applications/${app.id}`} className="block rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="font-bold text-ink">{app.title}</p>
                      <span className="text-xs font-bold text-amber-600">{completion.percent}%</span>
                    </div>
                    <ProgressBar percent={completion.percent} />
                    {completion.missing.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        ناقص: {completion.missing.slice(0, 3).join("، ")}
                        {completion.missing.length > 3 && " ..."}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black text-ink">أحدث طلبات المنح</p>
          <Link href="/applications/new" className="btn-secondary text-xs">
            <Plus size={14} /> طلب جديد
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <EmptyState icon={FileText} title="لا توجد طلبات منح بعد" description="ابدأ بإنشاء مشروع ثم أعد طلب منحة له." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="p-2.5 text-right">الطلب</th>
                  <th className="p-2.5 text-right">المشروع</th>
                  <th className="p-2.5 text-right">الحالة</th>
                  <th className="p-2.5 text-right">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="p-2.5">
                      <Link href={`/applications/${a.id}`} className="font-bold text-brand-700 hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="p-2.5 text-slate-500">{a.project?.title}</td>
                    <td className="p-2.5">
                      <Badge label={a.status} colorClass={STATUS_COLORS[a.status]} />
                    </td>
                    <td className="p-2.5 text-xs text-slate-400">{formatDate(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
