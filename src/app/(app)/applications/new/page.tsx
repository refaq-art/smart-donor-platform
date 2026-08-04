import { PageHeader } from "@/components/ui-bits";
import { createApplicationAction } from "@/app/actions/applications";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewApplicationForm from "@/components/new-application-form";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; opportunityId?: string }>;
}) {
  const session = await getSession();
  if (!canEdit(session?.role)) redirect("/applications");
  const sp = await searchParams;

  const [projects, opportunities] = await Promise.all([
    prisma.project.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.fundingOpportunity.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, projectId: true, donor: { select: { name: true } }, donorNameFreeText: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="طلب منحة جديد" subtitle="اختر المشروع وفرصة التمويل (اختياري) لبدء إعداد الطلب" />
      <NewApplicationForm
        action={createApplicationAction}
        projects={projects}
        opportunities={opportunities}
        defaultProjectId={sp.projectId}
        defaultOpportunityId={sp.opportunityId}
      />
    </div>
  );
}
