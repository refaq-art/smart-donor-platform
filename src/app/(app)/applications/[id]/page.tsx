import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { canEdit, canChangeStatus, canDelete } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import ApplicationEditor from "@/components/application-editor";
import StatusPanel from "@/components/status-panel";
import AttachmentsPanel from "@/components/attachments-panel";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { updateApplicationContentAction, changeApplicationStatusAction, deleteApplicationAction } from "@/app/actions/applications";
import { uploadAttachmentAction } from "@/app/actions/attachments";
import { formatDate } from "@/lib/utils";
import { Trash2, History } from "lucide-react";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const application = await prisma.grantApplication.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      project: true,
      opportunity: true,
      attachments: { orderBy: { uploadedAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: true } },
    },
  });
  if (!application) notFound();

  const [opportunities, users] = await Promise.all([
    prisma.fundingOpportunity.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [{ projectId: application.projectId }, { projectId: null }],
      },
      select: { id: true, title: true, field: true, requirements: true },
    }),
    prisma.user.findMany({ where: { organizationId: session.organizationId, isActive: true }, select: { id: true, name: true } }),
  ]);

  const readOnly = !canEdit(session?.role);
  const boundUpload = uploadAttachmentAction.bind(null, { applicationId: id }, `/applications/${id}`);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={application.title}
        subtitle={`المشروع: ${application.project.title}`}
        action={
          <>
            <Link href={`/projects/${application.projectId}`} className="btn-secondary">
              عرض المشروع
            </Link>
            {canDelete(session?.role) && (
              <form action={deleteApplicationAction.bind(null, id)}>
                <ConfirmSubmitButton confirmMessage="هل أنت متأكد من حذف هذا الطلب؟" className="btn-danger">
                  <Trash2 size={15} /> حذف
                </ConfirmSubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="mb-6 max-w-sm">
        <StatusPanel
          currentStatus={application.status}
          action={changeApplicationStatusAction.bind(null, id)}
          canChange={canChangeStatus(session?.role)}
        />
      </div>

      <ApplicationEditor
        applicationId={id}
        title={application.title}
        initialFields={{
          executiveSummary: application.executiveSummary || "",
          orgIntroduction: application.orgIntroduction || "",
          problemStatement: application.problemStatement || "",
          justification: application.justification || "",
          objectives: application.objectives || "",
          beneficiaries: application.beneficiaries || "",
          implementationPlan: application.implementationPlan || "",
          activities: application.activities || "",
          outputs: application.outputs || "",
          outcomes: application.outcomes || "",
          kpis: application.kpis || "",
          riskManagement: application.riskManagement || "",
          sustainability: application.sustainability || "",
          timeline: application.timeline || "",
          budget: application.budget || "",
          donorRequirements: application.donorRequirements || "",
        }}
        action={updateApplicationContentAction.bind(null, id)}
        projectContext={{
          title: application.project.title,
          problemStatement: application.project.problemStatement,
          generalObjective: application.project.generalObjective,
          category: application.project.category,
        }}
        opportunities={opportunities}
        users={users}
        opportunityId={application.opportunityId}
        assignedToId={application.assignedToId}
        readOnly={readOnly}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <p className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
            <History size={16} /> سجل متابعة الحالة
          </p>
          {application.statusHistory.length === 0 ? (
            <p className="text-xs text-slate-400">لا يوجد سجل بعد.</p>
          ) : (
            <ol className="relative space-y-4 border-e-2 border-brand-100 pe-4">
              {application.statusHistory.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -end-[21px] top-1 h-3 w-3 rounded-full bg-brand-500" />
                  <p className="text-sm font-bold text-ink">
                    {h.fromStatus ? `${h.fromStatus} ← ${h.toStatus}` : h.toStatus}
                  </p>
                  {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
                  {h.nextStep && <p className="text-xs text-brand-600">الخطوة التالية: {h.nextStep}</p>}
                  <p className="text-[11px] text-slate-400">
                    {formatDate(h.createdAt)} — {h.changedBy?.name || "النظام"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
        <AttachmentsPanel
          attachments={application.attachments}
          uploadAction={boundUpload}
          revalidateTarget={`/applications/${id}`}
          canEdit={!readOnly}
        />
      </div>
    </div>
  );
}
