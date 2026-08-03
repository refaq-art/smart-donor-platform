import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import ProjectForm from "@/components/project-form";
import { updateProjectAction } from "@/app/actions/projects";
import { parseJsonArray, parseKpis, parseBudgetItems } from "@/lib/utils";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!canEdit(session?.role)) redirect(`/projects/${id}`);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const toDateInput = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={`تعديل: ${project.title}`} subtitle="حدّث بيانات المشروع" />
      <ProjectForm
        action={updateProjectAction.bind(null, id)}
        submitLabel="حفظ التعديلات"
        defaults={{
          title: project.title,
          category: project.category || undefined,
          problemStatement: project.problemStatement || undefined,
          generalObjective: project.generalObjective || undefined,
          specificObjectives: parseJsonArray(project.specificObjectives),
          beneficiaryCategory: project.beneficiaryCategory || undefined,
          beneficiaryCount: project.beneficiaryCount,
          geographicScope: project.geographicScope || undefined,
          activities: parseJsonArray(project.activities),
          outputs: parseJsonArray(project.outputs),
          outcomes: parseJsonArray(project.outcomes),
          kpis: parseKpis(project.kpis),
          timelineStart: toDateInput(project.timelineStart),
          timelineEnd: toDateInput(project.timelineEnd),
          budgetTotal: project.budgetTotal,
          budgetBreakdown: parseBudgetItems(project.budgetBreakdown).map((b) => ({
            item: b.item,
            amount: String(b.amount),
          })),
          status: project.status,
        }}
      />
    </div>
  );
}
