import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFrameworkTree, getOrCreateAssessmentCycle, computeCompletionPercent } from "@/lib/assessment-data";
import { IndicatorCard } from "@/components/indicator-card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { submitAssessmentAction } from "@/app/actions/assessment-actions";
import { ASSESSMENT_STATUS_LABELS, type AssessmentStatusValue } from "@/lib/constants";

export default async function AssessmentPhasePage({ params }: { params: Promise<{ phase: string }> }) {
  const { phase: phaseParam } = await params;
  const phase = phaseParam.toUpperCase();
  if (phase !== "PRE" && phase !== "POST") notFound();

  const user = await requireUser(["ORG"]);
  const organizationId = user.organizationId!;

  if (phase === "POST") {
    const preCycle = await prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase: "PRE" } } });
    if (!preCycle || preCycle.status !== "APPROVED") {
      return (
        <div className="mx-auto max-w-3xl">
          <div className="card text-center text-slate-500">
            التقييم البعدي يُفتح بعد اعتماد المستشار للتقييم القبلي. تابع تنفيذ خطة التطوير حتى نهاية الـ100 يوم.
          </div>
        </div>
      );
    }
  }

  const cycle = await getOrCreateAssessmentCycle(organizationId, phase as "PRE" | "POST");
  const editable = cycle.status === "DRAFT" || cycle.status === "NEEDS_MORE_INFO";
  const domains = await getFrameworkTree();
  const responses = await prisma.assessmentResponse.findMany({ where: { assessmentCycleId: cycle.id } });
  const responseMap = new Map(responses.map((r) => [r.indicatorId, r.answerText]));
  const evidenceRows = await prisma.assessmentEvidence.findMany({ where: { assessmentCycleId: cycle.id } });
  const evidenceByIndicator = new Map<string, typeof evidenceRows>();
  for (const e of evidenceRows) {
    const list = evidenceByIndicator.get(e.indicatorId) ?? [];
    list.push(e);
    evidenceByIndicator.set(e.indicatorId, list);
  }
  const completion = await computeCompletionPercent(cycle.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="card sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{phase === "PRE" ? "الاستبيان القبلي" : "الاستبيان البعدي"}</h1>
          <p className="text-sm text-slate-500">
            الحالة: <span className="font-medium">{ASSESSMENT_STATUS_LABELS[cycle.status as AssessmentStatusValue]}</span>
            {" · "}نسبة الإكمال: <span className="font-medium">{completion}%</span>
          </p>
        </div>
        {editable && (
          <ConfirmSubmitButton
            action={submitAssessmentAction.bind(null, cycle.id)}
            confirmMessage="بعد الإرسال لن تتمكن من تعديل الإجابات إلا إذا طلب المستشار معلومات إضافية. هل تريد المتابعة؟"
          >
            إرسال للتحليل
          </ConfirmSubmitButton>
        )}
      </div>

      {domains.map((domain) => (
        <section key={domain.id} className="card">
          <h2 className="mb-1 text-lg font-bold text-navy-900">{domain.name}</h2>
          {domain.description && <p className="mb-4 text-sm text-slate-500">{domain.description}</p>}
          <div className="space-y-6">
            {domain.criteria.map((criterion) => (
              <div key={criterion.id}>
                {domain.criteria.length > 1 && <h3 className="mb-2 text-sm font-semibold text-slate-600">{criterion.name}</h3>}
                <div className="space-y-3">
                  {criterion.indicators.map((indicator) => (
                    <IndicatorCard
                      key={indicator.id}
                      cycleId={cycle.id}
                      indicator={indicator}
                      answerText={responseMap.get(indicator.id) ?? ""}
                      evidence={(evidenceByIndicator.get(indicator.id) ?? []).map((e) => ({
                        id: e.id,
                        fileName: e.fileName,
                        fileUrl: e.fileUrl,
                        linkUrl: e.linkUrl,
                      }))}
                      editable={editable}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
