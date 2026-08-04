import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canEdit, canDelete } from "@/lib/roles";
import { PageHeader, Badge, EmptyState } from "@/components/ui-bits";
import { OPPORTUNITY_STATUS_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatMoney, formatDate, daysUntil } from "@/lib/utils";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { deleteOpportunityAction } from "@/app/actions/opportunities";
import { Pencil, Trash2, Plus, FileText, ExternalLink, AlertTriangle } from "lucide-react";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const opp = await prisma.fundingOpportunity.findUnique({
    where: { id },
    include: { donor: true, project: true, applications: true },
  });
  if (!opp) notFound();

  const days = daysUntil(opp.deadline);
  const urgent = days !== null && days <= 14 && days >= 0 && opp.status !== "مغلقة";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={opp.title}
        subtitle={opp.donor?.name || opp.donorNameFreeText || undefined}
        action={
          <>
            <Badge label={opp.status} colorClass={OPPORTUNITY_STATUS_COLORS[opp.status]} />
            {canEdit(session?.role) && (
              <>
                <Link href={`/opportunities/${id}/edit`} className="btn-secondary"><Pencil size={15} /> تعديل</Link>
                <Link href={`/applications/new?opportunityId=${id}`} className="btn-primary"><Plus size={15} /> إعداد طلب</Link>
              </>
            )}
            {canDelete(session?.role) && (
              <form action={deleteOpportunityAction.bind(null, id)}>
                <ConfirmSubmitButton confirmMessage="هل أنت متأكد من حذف هذه الفرصة؟" className="btn-danger">
                  <Trash2 size={15} /> حذف
                </ConfirmSubmitButton>
              </form>
            )}
          </>
        }
      />

      {urgent && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertTriangle size={16} /> الموعد النهائي يقترب — باقي {days} يومًا فقط ({formatDate(opp.deadline)})
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card grid gap-4 p-5 sm:grid-cols-2">
            <Field label="مجال المنحة" value={opp.field} />
            <Field label="القيمة المتوقعة" value={formatMoney(opp.expectedAmount)} />
            <Field label="تاريخ بدء التقديم" value={formatDate(opp.startDate)} />
            <Field label="الموعد النهائي" value={formatDate(opp.deadline)} />
            {opp.applicationUrl && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-400">رابط التقديم</p>
                <a href={opp.applicationUrl} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline">
                  <ExternalLink size={14} /> فتح رابط التقديم
                </a>
              </div>
            )}
          </div>

          <div className="card space-y-3 p-5">
            <p className="text-sm font-black text-brand-700">الشروط والمتطلبات</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{opp.requirements || "لم تُسجل شروط بعد."}</p>
          </div>

          <div className="card space-y-3 p-5">
            <p className="text-sm font-black text-brand-700">طلبات المنح المرتبطة</p>
            {opp.applications.length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد طلبات مرتبطة بهذه الفرصة بعد" />
            ) : (
              <ul className="space-y-2">
                {opp.applications.map((a) => (
                  <li key={a.id}>
                    <Link href={`/applications/${a.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50">
                      <span className="font-bold">{a.title}</span>
                      <Badge label={a.status} colorClass={STATUS_COLORS[a.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {opp.donor && (
            <div className="card space-y-2 p-5">
              <p className="text-sm font-black text-ink">الجهة المانحة</p>
              <Link href={`/donors/${opp.donor.id}`} className="font-bold text-brand-600 hover:underline">
                {opp.donor.name}
              </Link>
              {opp.donor.contactName && <p className="text-xs text-slate-400">{opp.donor.contactName}</p>}
            </div>
          )}
          {opp.project && (
            <div className="card space-y-2 p-5">
              <p className="text-sm font-black text-ink">المشروع المرتبط</p>
              <Link href={`/projects/${opp.project.id}`} className="font-bold text-brand-600 hover:underline">
                {opp.project.title}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{value?.trim() ? value : "—"}</p>
    </div>
  );
}
