import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getConsultantOrgSummaries } from "@/lib/consultant-data";
import { prisma } from "@/lib/prisma";

export default async function ConsultantWorkCenterPage() {
  const user = await requireUser(["CONSULTANT"]);
  const summaries = await getConsultantOrgSummaries(user.consultant!.id);
  const orgIds = summaries.map((s) => s.org.id);

  const tasksAwaitingReview = summaries.reduce((sum, s) => sum + s.awaitingReviewTasks, 0);
  const lateOrgs = summaries.filter((s) => s.progress.status === "LATE" || s.progress.status === "VERY_LATE");
  const inactiveOrgs = summaries.filter((s) => (s.daysSinceActivity ?? 0) >= 7);
  const awaitingAssessmentApproval = summaries.filter((s) => s.preCycle?.status === "AWAITING_CONSULTANT_REVIEW" || s.postCycle?.status === "AWAITING_CONSULTANT_REVIEW");

  const recentEvidence = await prisma.assessmentEvidence.count({
    where: { assessmentCycle: { organizationId: { in: orgIds } }, createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">ماذا يحتاج تدخلي اليوم؟</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WorkCard title={`${tasksAwaitingReview} مهمة تنتظر المراجعة`} href="/consultant" active={tasksAwaitingReview > 0}>
          راجع المهام التي أرسلتها الجمعيات وأنجزت شواهدها.
        </WorkCard>

        <WorkCard title={`${lateOrgs.length} جمعية متأخرة عن مسار البرنامج`} href="/consultant?sort=late" active={lateOrgs.length > 0}>
          {lateOrgs.map((s) => s.org.name).join("، ") || "لا يوجد"}
        </WorkCard>

        <WorkCard title={`${inactiveOrgs.length} جمعية لم تحدّث نشاطها منذ 7 أيام فأكثر`} href="/consultant?sort=activity" active={inactiveOrgs.length > 0}>
          {inactiveOrgs.map((s) => s.org.name).join("، ") || "لا يوجد"}
        </WorkCard>

        <WorkCard title={`${recentEvidence} شاهد جديد خلال آخر 3 أيام`} href="/consultant" active={recentEvidence > 0}>
          شواهد جديدة تحتاج مراجعتك ضمن التقييمات والمهام.
        </WorkCard>

        <WorkCard title={`${awaitingAssessmentApproval.length} جمعية تنتظر اعتماد القياس`} href="/consultant" active={awaitingAssessmentApproval.length > 0}>
          {awaitingAssessmentApproval.map((s) => s.org.name).join("، ") || "لا يوجد"}
        </WorkCard>
      </div>
    </div>
  );
}

function WorkCard({ title, href, active, children }: { title: string; href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`card block transition hover:shadow-md ${active ? "border-r-4 border-r-navy-600" : "opacity-60"}`}>
      <div className="mb-1 font-bold text-navy-900">{title}</div>
      <div className="text-xs text-slate-500">{children}</div>
    </Link>
  );
}
