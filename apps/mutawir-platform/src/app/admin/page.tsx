import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  await requireUser(["ADMIN"]);
  const [orgs, consultants, council, domains, indicators, tasks, pendingApprovals] = await Promise.all([
    prisma.organization.count(),
    prisma.consultant.count(),
    prisma.councilMember.count(),
    prisma.assessmentDomain.count(),
    prisma.assessmentIndicator.count(),
    prisma.task.count(),
    prisma.assessmentCycle.count({ where: { status: "AWAITING_CONSULTANT_REVIEW" } }),
  ]);

  const stats = [
    { label: "الجمعيات", value: orgs },
    { label: "المستشارون", value: consultants },
    { label: "أعضاء المجلس", value: council },
    { label: "المحاور", value: domains },
    { label: "المؤشرات", value: indicators },
    { label: "المهام", value: tasks },
    { label: "تقييمات بانتظار الاعتماد", value: pendingApprovals },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">نظرة عامة على النظام</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-navy-900">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
