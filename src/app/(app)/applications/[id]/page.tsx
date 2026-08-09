import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { canEdit, canChangeStatus, canDelete, canComment, canReview } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import ApplicationEditor from "@/components/application-editor";
import StatusPanel from "@/components/status-panel";
import AttachmentsPanel from "@/components/attachments-panel";
import ApplicationCommentsPanel from "@/components/application-comments-panel";
import ApplicationVersionsPanel from "@/components/application-versions-panel";
import ReportObligationsPanel from "@/components/report-obligations-panel";
import CorrespondencePanel from "@/components/correspondence-panel";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { updateApplicationContentAction, changeApplicationStatusAction, deleteApplicationAction } from "@/app/actions/applications";
import { uploadAttachmentAction } from "@/app/actions/attachments";
import { addCommentAction, resolveCommentAction, deleteCommentAction } from "@/app/actions/application-comments";
import { restoreVersionAction } from "@/app/actions/application-versions";
import { addReportObligationAction, setReportObligationSubmittedAction, deleteReportObligationAction } from "@/app/actions/report-obligations";
import { generateCorrespondenceAction, deleteCorrespondenceAction } from "@/app/actions/correspondence";
import { FIELD_KEYS, type Fields } from "@/lib/application-fields";
import { formatDate } from "@/lib/utils";
import { Trash2, History, Printer, FileDown, FileSpreadsheet } from "lucide-react";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const application = await prisma.grantApplication.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      project: true,
      opportunity: { include: { donor: true } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: true } },
      comments: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } },
      versions: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      reportObligations: { orderBy: { dueDate: "asc" } },
      correspondences: { orderBy: { createdAt: "desc" } },
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
            <Link href={`/applications/${id}/print`} className="btn-secondary" target="_blank">
              <Printer size={15} /> طباعة / PDF
            </Link>
            <a href={`/api/applications/${id}/export/docx`} className="btn-secondary">
              <FileDown size={15} /> تصدير Word
            </a>
            <a href={`/api/applications/${id}/export/budget-xlsx`} className="btn-secondary">
              <FileSpreadsheet size={15} /> تصدير الميزانية Excel
            </a>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ApplicationCommentsPanel
            applicationId={id}
            comments={application.comments}
            currentUserId={session.userId}
            canComment={canComment(session?.role)}
            canReview={canReview(session?.role)}
            canDeleteAny={canDelete(session?.role)}
            addAction={addCommentAction}
            resolveAction={resolveCommentAction}
            deleteAction={deleteCommentAction}
          />
        </div>
        <ApplicationVersionsPanel
          applicationId={id}
          versions={application.versions}
          current={{
            title: application.title,
            ...(Object.fromEntries(FIELD_KEYS.map((k) => [k, application[k] || ""])) as Fields),
          }}
          canRestore={!readOnly}
          restoreAction={restoreVersionAction}
        />
      </div>

      {(application.status === "مقبول" || application.reportObligations.length > 0) && (
        <div className="mt-6">
          <ReportObligationsPanel
            applicationId={id}
            obligations={application.reportObligations}
            canEdit={!readOnly}
            addAction={addReportObligationAction}
            setSubmittedAction={setReportObligationSubmittedAction}
            deleteAction={deleteReportObligationAction}
          />
        </div>
      )}

      <div className="mt-6">
        <CorrespondencePanel
          applicationId={id}
          donorId={application.opportunity?.donorId || null}
          donorName={application.opportunity?.donor?.name || null}
          letters={application.correspondences}
          canEdit={!readOnly}
          generateAction={generateCorrespondenceAction}
          deleteAction={deleteCorrespondenceAction}
        />
      </div>
    </div>
  );
}
