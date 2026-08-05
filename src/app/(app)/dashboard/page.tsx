import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { PageHeader, StatCard, Badge, EmptyState, ProgressBar } from "@/components/ui-bits";
import { STATUS_COLORS, OPPORTUNITY_STATUS_COLORS } from "@/lib/constants";
import { computeCompletion } from "@/lib/completion";
import { documentValidity } from "@/lib/document-validity";
import { formatDate, formatMoney, daysUntil } from "@/lib/utils";
import { FolderKanban, Target, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Plus, FolderOpen, MessageSquare, Timer, Wallet } from "lucide-react";

const ACTIVE_APP_STATUSES = ["مسودة", "تحت المراجعة الداخلية", "جاهز للإرسال", "مطلوب استكمال"];
const STALLED_AFTER_DAYS = 14;

export default async function DashboardPage() {
  const session = await requireSession();
  const orgWhere = { organizationId: session.organizationId };

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  const docsSoon = new Date();
  docsSoon.setDate(docsSoon.getDate() + 30);
  const stalledCutoff = new Date();
  stalledCutoff.setDate(stalledCutoff.getDate() - STALLED_AFTER_DAYS);

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
    expiringDocuments,
    stalledApplications,
    openChangeRequests,
    sentAndBeyondApps,
    prepTimeApps,
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
    prisma.orgDocument.findMany({
      where: { ...orgWhere, expiryDate: { lte: docsSoon } },
      orderBy: { expiryDate: "asc" },
      take: 8,
    }),
    prisma.grantApplication.findMany({
      where: { ...orgWhere, status: { in: ACTIVE_APP_STATUSES }, updatedAt: { lte: stalledCutoff } },
      include: { project: true },
      orderBy: { updatedAt: "asc" },
      take: 8,
    }),
    prisma.applicationComment.findMany({
      where: {
        status: "OPEN",
        kind: "CHANGE_REQUEST",
        application: { organizationId: session.organizationId, status: { notIn: ["مقبول", "مرفوض", "مؤجل"] } },
      },
      include: { application: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.grantApplication.findMany({
      where: { ...orgWhere, status: { in: ["تم الإرسال", "مقبول", "مرفوض"] }, opportunityId: { not: null } },
      include: { opportunity: { select: { expectedAmount: true } } },
    }),
    prisma.grantApplication.findMany({
      where: { ...orgWhere, statusHistory: { some: { toStatus: "تم الإرسال" } } },
      select: { createdAt: true, statusHistory: { where: { toStatus: "تم الإرسال" }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
    }),
  ]);

  const totalDecided = acceptedApps + rejectedApps;
  const acceptanceRate = totalDecided > 0 ? Math.round((acceptedApps / totalDecided) * 100) : null;

  const incompleteApps = inProgressApps
    .map((a) => ({ app: a, completion: computeCompletion(a) }))
    .filter((x) => x.completion.percent < 100);

  const requestedTotal = sentAndBeyondApps.reduce((sum, a) => sum + (a.opportunity?.expectedAmount || 0), 0);
  const acceptedTotal = sentAndBeyondApps
    .filter((a) => a.status === "مقبول")
    .reduce((sum, a) => sum + (a.opportunity?.expectedAmount || 0), 0);

  const prepDurations = prepTimeApps
    .filter((a) => a.statusHistory.length > 0)
    .map((a) => (a.statusHistory[0].createdAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgPrepDays = prepDurations.length > 0 ? Math.round(prepDurations.reduce((s, d) => s + d, 0) / prepDurations.length) : null;

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
        <StatCard
          label="متوسط زمن التحضير"
          value={avgPrepDays !== null ? `${avgPrepDays} يومًا` : "—"}
          hint="من إنشاء الطلب حتى إرساله"
          icon={Timer}
          tone="blue"
        />
        <StatCard
          label="التمويل المطلوب / المقبول"
          value={`${formatMoney(requestedTotal)} / ${formatMoney(acceptedTotal)}`}
          hint="إجمالي قيمة الفرص المرتبطة بالطلبات المرسلة"
          icon={Wallet}
          tone="gold"
        />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-ink">مستندات تنتهي صلاحيتها</p>
            <Link href="/settings/organization" className="text-xs font-bold text-brand-600 hover:underline">
              مكتبة المستندات
            </Link>
          </div>
          {expiringDocuments.length === 0 ? (
            <EmptyState icon={FolderOpen} title="لا توجد مستندات تنتهي صلاحيتها قريبًا" />
          ) : (
            <ul className="space-y-2">
              {expiringDocuments.map((d) => {
                const v = documentValidity(d.expiryDate);
                return (
                  <li key={d.id} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                    <p className="font-bold text-ink">{d.title}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{d.category}</span>
                      <span className={v.tone === "danger" ? "font-bold text-red-600" : "font-bold text-amber-600"}>{v.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-ink">طلبات متوقفة (بلا تحديث {STALLED_AFTER_DAYS}+ يومًا)</p>
          </div>
          {stalledApplications.length === 0 ? (
            <EmptyState icon={Clock} title="لا توجد طلبات متوقفة حاليًا" />
          ) : (
            <ul className="space-y-2">
              {stalledApplications.map((a) => (
                <li key={a.id}>
                  <Link href={`/applications/${a.id}`} className="block rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50">
                    <p className="font-bold text-ink">{a.title}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <Badge label={a.status} colorClass={STATUS_COLORS[a.status]} />
                      <span className="text-slate-400">آخر تحديث {formatDate(a.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-ink">طلبات تعديل مفتوحة تحتاج إجراء</p>
          </div>
          {openChangeRequests.length === 0 ? (
            <EmptyState icon={MessageSquare} title="لا توجد طلبات تعديل مفتوحة" />
          ) : (
            <ul className="space-y-2">
              {openChangeRequests.map((c) => (
                <li key={c.id}>
                  <Link href={`/applications/${c.application.id}`} className="block rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2.5 text-sm hover:bg-amber-50">
                    <p className="font-bold text-ink">{c.application.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.body}</p>
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
