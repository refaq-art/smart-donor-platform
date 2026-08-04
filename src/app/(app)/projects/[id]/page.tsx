import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canEdit, canDelete } from "@/lib/roles";
import { PageHeader, Badge, EmptyState } from "@/components/ui-bits";
import { PROJECT_STATUS_COLORS, OPPORTUNITY_STATUS_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatMoney, formatDate, parseJsonArray, parseKpis, parseBudgetItems } from "@/lib/utils";
import AttachmentsPanel from "@/components/attachments-panel";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { uploadAttachmentAction } from "@/app/actions/attachments";
import { duplicateProjectAction, deleteProjectAction } from "@/app/actions/projects";
import { Pencil, Copy, Trash2, Plus, Target, FileText } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { uploadedAt: "desc" } },
      opportunities: true,
      applications: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!project) notFound();

  const objectives = parseJsonArray(project.specificObjectives);
  const activities = parseJsonArray(project.activities);
  const outputs = parseJsonArray(project.outputs);
  const outcomes = parseJsonArray(project.outcomes);
  const kpis = parseKpis(project.kpis);
  const budget = parseBudgetItems(project.budgetBreakdown);

  const boundUpload = uploadAttachmentAction.bind(null, { projectId: id }, `/projects/${id}`);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={project.title}
        subtitle={project.category || undefined}
        action={
          <>
            <Badge label={project.status} colorClass={PROJECT_STATUS_COLORS[project.status]} />
            {canEdit(session?.role) && (
              <>
                <Link href={`/projects/${id}/edit`} className="btn-secondary">
                  <Pencil size={15} /> تعديل
                </Link>
                <form action={duplicateProjectAction.bind(null, id)}>
                  <button type="submit" className="btn-secondary">
                    <Copy size={15} /> تكرار المشروع
                  </button>
                </form>
                <Link href={`/applications/new?projectId=${id}`} className="btn-primary">
                  <Plus size={15} /> إعداد طلب منحة
                </Link>
              </>
            )}
            {canDelete(session?.role) && (
              <form action={deleteProjectAction.bind(null, id)}>
                <ConfirmSubmitButton confirmMessage="هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع." className="btn-danger">
                  <Trash2 size={15} /> حذف
                </ConfirmSubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="المشكلة والأهداف">
            <Field label="المشكلة" value={project.problemStatement} />
            <Field label="الهدف العام" value={project.generalObjective} />
            <ListField label="الأهداف التفصيلية" items={objectives} />
          </Section>

          <Section title="الفئة المستفيدة والنطاق">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الفئة المستفيدة" value={project.beneficiaryCategory} />
              <Field label="عدد المستفيدين" value={project.beneficiaryCount?.toString()} />
              <Field label="النطاق الجغرافي" value={project.geographicScope} className="sm:col-span-2" />
            </div>
          </Section>

          <Section title="خطة التنفيذ">
            <ListField label="الأنشطة" items={activities} />
            <ListField label="المخرجات" items={outputs} />
            <ListField label="النتائج المتوقعة" items={outcomes} />
            {kpis.length > 0 && (
              <div>
                <p className="field-label">مؤشرات الأداء</p>
                <ul className="space-y-1">
                  {kpis.map((k, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-bold">{k.indicator}</span>
                      {k.target && <span className="text-slate-500"> — المستهدف: {k.target}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section title="الجدول الزمني والميزانية">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="بداية التنفيذ" value={formatDate(project.timelineStart)} />
              <Field label="نهاية التنفيذ" value={formatDate(project.timelineEnd)} />
              <Field label="إجمالي الميزانية" value={formatMoney(project.budgetTotal)} />
            </div>
            {budget.length > 0 && (
              <div className="overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="p-2.5 text-right">البند</th>
                      <th className="p-2.5 text-right">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.map((b, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2.5">{b.item}</td>
                        <td className="p-2.5">{formatMoney(Number(b.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="طلبات المنح المرتبطة">
            {project.applications.length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد طلبات منح لهذا المشروع بعد" />
            ) : (
              <ul className="space-y-2">
                {project.applications.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/applications/${a.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50"
                    >
                      <span className="font-bold">{a.title}</span>
                      <Badge label={a.status} colorClass={STATUS_COLORS[a.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
              <Target size={16} /> فرص التمويل المرتبطة
            </p>
            {project.opportunities.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد فرص مرتبطة بعد.</p>
            ) : (
              <ul className="space-y-2">
                {project.opportunities.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="block rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-brand-50"
                    >
                      <p className="font-bold text-ink">{o.title}</p>
                      <Badge label={o.status} colorClass={OPPORTUNITY_STATUS_COLORS[o.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AttachmentsPanel
            attachments={project.attachments}
            uploadAction={boundUpload}
            revalidateTarget={`/projects/${id}`}
            canEdit={canEdit(session?.role)}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-5">
      <p className="text-sm font-black text-brand-700">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm text-ink">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="field-label">{label}</p>
      <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-ink">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
