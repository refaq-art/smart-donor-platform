import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeOrgProgress } from "@/lib/progress";
import { ASSESSMENT_STATUS_LABELS, type AssessmentStatusValue } from "@/lib/constants";
import { ORG_CONTEXT_FIELDS } from "@/lib/data/framework-seed-data";

export default async function ConsultantOrgOverviewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await requireUser(["CONSULTANT"]);
  const org = await prisma.organization.findFirst({ where: { id: orgId, consultantId: user.consultant!.id } });
  if (!org) notFound();

  const cycles = await prisma.assessmentCycle.findMany({ where: { organizationId: orgId } });
  const preCycle = cycles.find((c) => c.phase === "PRE");
  const postCycle = cycles.find((c) => c.phase === "POST");
  const plan = await prisma.developmentPlan.findFirst({ where: { organizationId: orgId }, include: { tasks: true } });
  const totalTasks = plan?.tasks.length ?? 0;
  const completedTasks = plan?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const progress = computeOrgProgress({ programStartDate: org.programStartDate, totalTasks, completedTasks });
  const contextAnswers = JSON.parse(org.contextAnswers || "{}") as Record<string, string>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{org.name}</h1>
        <p className="text-sm text-slate-500">
          {org.region} · المدير التنفيذي: {org.executiveDirector ?? "—"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href={`/consultant/assessments/${preCycle?.id ?? ""}`} className={`card block ${!preCycle ? "pointer-events-none opacity-50" : "hover:shadow-md"}`}>
          <div className="text-xs text-slate-400">التقييم القبلي</div>
          <div className="mt-1 text-lg font-bold text-navy-900">{preCycle ? ASSESSMENT_STATUS_LABELS[preCycle.status as AssessmentStatusValue] : "لم يبدأ"}</div>
          {preCycle?.overallScore && <div className="text-sm text-slate-500">النتيجة: {preCycle.overallScore.toFixed(2)} / 5</div>}
        </Link>
        <Link href={`/consultant/organizations/${org.id}/gaps`} className="card block hover:shadow-md">
          <div className="text-xs text-slate-400">تحليل الفجوات وخطة التطوير</div>
          <div className="mt-1 text-lg font-bold text-navy-900">{totalTasks} مهمة</div>
          <div className="text-sm text-slate-500">مكتملة: {completedTasks} · الإنجاز {progress.actualPercent}%</div>
        </Link>
        <Link href={`/consultant/assessments/${postCycle?.id ?? ""}`} className={`card block ${!postCycle ? "pointer-events-none opacity-50" : "hover:shadow-md"}`}>
          <div className="text-xs text-slate-400">التقييم البعدي</div>
          <div className="mt-1 text-lg font-bold text-navy-900">{postCycle ? ASSESSMENT_STATUS_LABELS[postCycle.status as AssessmentStatusValue] : "لم يبدأ بعد"}</div>
          {postCycle?.overallScore && <div className="text-sm text-slate-500">النتيجة: {postCycle.overallScore.toFixed(2)} / 5</div>}
        </Link>
      </div>

      <div className="card">
        <h2 className="mb-2 font-bold text-slate-800">أهداف الجمعية ونقاط التركيز</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          {ORG_CONTEXT_FIELDS.filter((f) => contextAnswers[f.key]).map((f) => (
            <div key={f.key}>
              <dt className="text-xs text-slate-400">{f.label}</dt>
              <dd className="text-slate-700">{contextAnswers[f.key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
