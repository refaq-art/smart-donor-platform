import { PageHeader } from "@/components/ui-bits";
import OpportunityForm from "@/components/opportunity-form";
import { createOpportunityAction } from "@/app/actions/opportunities";
import { requireSession } from "@/lib/authz";
import { canEdit } from "@/lib/roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ donorId?: string; projectId?: string }>;
}) {
  const session = await requireSession();
  if (!canEdit(session?.role)) redirect("/opportunities");
  const sp = await searchParams;

  const [donors, projects] = await Promise.all([
    prisma.donor.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { organizationId: session.organizationId }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="إضافة فرصة تمويل" subtitle="سجّل تفاصيل الفرصة لمتابعتها والتقديم عليها" />
      <OpportunityForm
        action={createOpportunityAction}
        donors={donors}
        projects={projects}
        submitLabel="حفظ الفرصة"
        defaults={{ donorId: sp.donorId, projectId: sp.projectId }}
      />
    </div>
  );
}
