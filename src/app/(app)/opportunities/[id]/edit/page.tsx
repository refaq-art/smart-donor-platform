import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { canEdit } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import OpportunityForm from "@/components/opportunity-form";
import { updateOpportunityAction } from "@/app/actions/opportunities";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!canEdit(session?.role)) redirect(`/opportunities/${id}`);

  const [opp, donors, projects] = await Promise.all([
    prisma.fundingOpportunity.findFirst({ where: { id, organizationId: session!.organizationId } }),
    prisma.donor.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { organizationId: session.organizationId }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!opp) notFound();

  const toDateInput = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`تعديل: ${opp.title}`} />
      <OpportunityForm
        action={updateOpportunityAction.bind(null, id)}
        donors={donors}
        projects={projects}
        submitLabel="حفظ التعديلات"
        defaults={{
          title: opp.title,
          donorId: opp.donorId || undefined,
          donorNameFreeText: opp.donorNameFreeText || undefined,
          field: opp.field || undefined,
          expectedAmount: opp.expectedAmount,
          requirements: opp.requirements || undefined,
          startDate: toDateInput(opp.startDate),
          deadline: toDateInput(opp.deadline),
          applicationUrl: opp.applicationUrl || undefined,
          status: opp.status,
          projectId: opp.projectId || undefined,
        }}
      />
    </div>
  );
}
