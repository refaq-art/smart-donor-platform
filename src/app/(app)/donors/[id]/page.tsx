import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { canEdit, canDelete } from "@/lib/roles";
import { PageHeader, Badge, EmptyState } from "@/components/ui-bits";
import { OPPORTUNITY_STATUS_COLORS } from "@/lib/constants";
import AttachmentsPanel from "@/components/attachments-panel";
import DonorSupportPanel from "@/components/donor-support-panel";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { uploadAttachmentAction } from "@/app/actions/attachments";
import { deleteDonorAction } from "@/app/actions/donors";
import { addSupportRecordAction, deleteSupportRecordAction } from "@/app/actions/donor-support";
import { formatDate } from "@/lib/utils";
import { CORRESPONDENCE_TYPES } from "@/lib/constants";
import type { CorrespondenceType } from "@/lib/correspondence-templates";
import { Pencil, Trash2, Target, Phone, Mail, MapPin, Plus, Printer } from "lucide-react";

const RELATIONSHIP_COLORS: Record<string, string> = {
  "نشط": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "محتمل": "bg-blue-50 text-blue-700 border-blue-300",
  "متوقف": "bg-slate-100 text-slate-500 border-slate-300",
};

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const [donor, projects] = await Promise.all([
    prisma.donor.findFirst({
      where: { id, organizationId: session.organizationId },
      include: {
        attachments: { orderBy: { uploadedAt: "desc" } },
        opportunities: { include: { project: true } },
        supportRecords: { include: { project: { select: { id: true, title: true } } } },
        correspondences: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.project.findMany({ where: { organizationId: session.organizationId }, select: { id: true, title: true } }),
  ]);
  if (!donor) notFound();

  const boundUpload = uploadAttachmentAction.bind(null, { donorId: id }, `/donors/${id}`);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={donor.name}
        subtitle={donor.type || undefined}
        action={
          <>
            <Badge label={donor.relationshipStatus} colorClass={RELATIONSHIP_COLORS[donor.relationshipStatus]} />
            {canEdit(session?.role) && (
              <>
                <Link href={`/donors/${id}/edit`} className="btn-secondary"><Pencil size={15} /> تعديل</Link>
                <Link href={`/opportunities/new?donorId=${id}`} className="btn-primary"><Plus size={15} /> فرصة جديدة</Link>
              </>
            )}
            {canDelete(session?.role) && (
              <form action={deleteDonorAction.bind(null, id)}>
                <ConfirmSubmitButton confirmMessage="هل أنت متأكد من حذف هذه الجهة المانحة؟" className="btn-danger">
                  <Trash2 size={15} /> حذف
                </ConfirmSubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card space-y-4 p-5">
            <p className="text-sm font-black text-brand-700">بيانات الجهة</p>
            <Field label="مجالات الدعم" value={donor.supportFields} />
            <Field label="شروط التمويل" value={donor.fundingConditions} />
            <Field label="ملاحظات" value={donor.notes} />
          </div>

          <div className="card space-y-3 p-5">
            <p className="text-sm font-black text-brand-700">فرص التمويل والمشاريع المرتبطة</p>
            {donor.opportunities.length === 0 ? (
              <EmptyState icon={Target} title="لا توجد فرص مسجلة لهذه الجهة بعد" />
            ) : (
              <ul className="space-y-2">
                {donor.opportunities.map((o) => (
                  <li key={o.id}>
                    <Link href={`/opportunities/${o.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-brand-50">
                      <div>
                        <p className="font-bold">{o.title}</p>
                        {o.project && <p className="text-xs text-slate-400">مرتبطة بمشروع: {o.project.title}</p>}
                      </div>
                      <Badge label={o.status} colorClass={OPPORTUNITY_STATUS_COLORS[o.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DonorSupportPanel
            donorId={id}
            records={donor.supportRecords}
            projects={projects}
            canEdit={canEdit(session?.role)}
            addAction={addSupportRecordAction}
            deleteAction={deleteSupportRecordAction}
          />
        </div>

        <div className="space-y-6">
          <div className="card space-y-3 p-5">
            <p className="text-sm font-black text-ink">بيانات التواصل</p>
            <ContactRow icon={Phone} value={donor.phone} />
            <ContactRow icon={Mail} value={donor.email} />
            <ContactRow icon={MapPin} value={donor.city} />
            {donor.contactName && <p className="text-xs text-slate-400">المسؤول: {donor.contactName}</p>}
          </div>
          <AttachmentsPanel
            attachments={donor.attachments}
            uploadAction={boundUpload}
            revalidateTarget={`/donors/${id}`}
            canEdit={canEdit(session?.role)}
          />
          {donor.correspondences.length > 0 && (
            <div className="card space-y-3 p-5">
              <p className="text-sm font-black text-ink">الخطابات والمراسلات</p>
              <ul className="space-y-2">
                {donor.correspondences.map((l) => (
                  <li key={l.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                    <span className="me-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      {CORRESPONDENCE_TYPES[l.type as CorrespondenceType] || l.type}
                    </span>
                    <span className="font-bold text-ink">{l.subject}</span>
                    <div className="mt-1 flex items-center justify-between text-slate-400">
                      <span>{formatDate(l.createdAt)}</span>
                      <Link href={`/letters/${l.id}/print`} target="_blank" className="flex items-center gap-1 font-bold text-brand-600 hover:underline">
                        <Printer size={12} /> عرض
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
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

function ContactRow({ icon: Icon, value }: { icon: typeof Phone; value?: string | null }) {
  if (!value) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-ink" dir="ltr">
      <Icon size={14} className="text-brand-500" /> {value}
    </p>
  );
}
