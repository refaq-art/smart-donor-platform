import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { PageHeader } from "@/components/ui-bits";
import ReportsView from "@/components/reports-view";

export default async function ReportsPage() {
  const session = await requireSession();
  const orgWhere = { organizationId: session.organizationId };
  const [projects, opportunities, applications, donors, users] = await Promise.all([
    prisma.project.findMany({
      where: orgWhere,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true, opportunities: true } } },
    }),
    prisma.fundingOpportunity.findMany({
      where: orgWhere,
      orderBy: { deadline: "asc" },
      include: { donor: true, project: true },
    }),
    prisma.grantApplication.findMany({
      where: orgWhere,
      orderBy: { updatedAt: "desc" },
      include: { project: true, opportunity: { include: { donor: true } }, assignedTo: true, createdBy: true },
    }),
    prisma.donor.findMany({
      where: orgWhere,
      orderBy: { name: "asc" },
      include: { _count: { select: { opportunities: true } } },
    }),
    prisma.user.findMany({
      where: orgWhere,
      orderBy: { name: "asc" },
      include: { _count: { select: { assignedApplications: true, createdApplications: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="التقارير" subtitle="تقارير قابلة للطباعة والتصدير لجميع بيانات المنصة" />
      <ReportsView
        projects={projects}
        opportunities={opportunities}
        applications={applications}
        donors={donors}
        users={users}
      />
    </div>
  );
}
