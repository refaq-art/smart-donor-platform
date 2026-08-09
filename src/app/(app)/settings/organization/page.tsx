import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { canManageOrgProfile } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import OrganizationForm from "@/components/organization-form";
import BoardMembersPanel from "@/components/board-members-panel";
import DocumentLibrary from "@/components/document-library";
import {
  updateOrganizationAction,
  addBoardMemberAction,
  deleteBoardMemberAction,
  uploadOrgDocumentAction,
  deleteOrgDocumentAction,
} from "@/app/actions/organization";
import { parseJsonArray } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

export default async function OrganizationProfilePage() {
  const session = await requireSession();
  const editable = canManageOrgProfile(session.role);

  const aiProviderEnv = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const aiActive = aiProviderEnv === "openai" && !!process.env.AI_API_KEY;
  const aiModel = process.env.AI_MODEL || "gpt-4o-mini";

  const [org, boardMembers, documents] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.boardMember.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orgDocument.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  if (!org) notFound();

  const toInput = (dt?: Date | null) => (dt ? dt.toISOString().slice(0, 10) : undefined);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="ملف الجمعية"
        subtitle="مصدر واحد لبيانات الجمعية — تُستخدم تلقائيًا عند إعداد طلبات المنح"
      />

      <div className="space-y-6">
        {editable && (
          <div className="card flex flex-wrap items-center justify-between gap-2 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Sparkles size={16} className="text-gold-500" /> حالة المساعد الذكي
            </p>
            {aiActive ? (
              <span className="badge border-emerald-300 bg-emerald-50 text-emerald-700">
                مفعّل — مزود حقيقي ({aiModel})
              </span>
            ) : (
              <span className="badge border-slate-300 bg-slate-100 text-slate-600" title="اضبط AI_PROVIDER=openai وAI_API_KEY في متغيرات البيئة لتفعيله">
                وضع تجريبي (Mock) — بلا مفتاح ذكاء اصطناعي حقيقي
              </span>
            )}
          </div>
        )}

        <OrganizationForm
          action={updateOrganizationAction}
          readOnly={!editable}
          defaults={{
            name: org.name,
            about: org.about || undefined,
            regNumber: org.regNumber || undefined,
            licenseDate: toInput(org.licenseDate),
            licenseExpiry: toInput(org.licenseExpiry),
            supervisingBody: org.supervisingBody || undefined,
            foundedAt: toInput(org.foundedAt),
            sector: org.sector || undefined,
            geographicScope: org.geographicScope || undefined,
            city: org.city || undefined,
            strategicGoals: parseJsonArray(org.strategicGoals),
            phone: org.phone || undefined,
            email: org.email || undefined,
            website: org.website || undefined,
            address: org.address || undefined,
            delegateName: org.delegateName || undefined,
            delegateRole: org.delegateRole || undefined,
            delegatePhone: org.delegatePhone || undefined,
            delegateEmail: org.delegateEmail || undefined,
            bankName: org.bankName || undefined,
            iban: org.iban || undefined,
            annualBudget: org.annualBudget,
          }}
        />

        <BoardMembersPanel
          members={boardMembers}
          addAction={addBoardMemberAction}
          deleteAction={deleteBoardMemberAction}
          editable={editable}
        />

        <DocumentLibrary
          documents={documents}
          uploadAction={uploadOrgDocumentAction}
          deleteAction={deleteOrgDocumentAction}
          editable={editable}
        />
      </div>
    </div>
  );
}
